#!/usr/bin/env python3
"""
Question bank cleanup script for PedDent QE app.
Filters, deduplicates, cleans, and adds AAPD source URLs.
"""

import json
import re
from collections import defaultdict, Counter

INPUT_PATH = '/Users/clugodmd/Developer/peddent-qe-app/src/data/questions.json'
OUTPUT_PATH = '/Users/clugodmd/Developer/peddent-qe-app/src/data/questions.json'
BACKUP_PATH = '/Users/clugodmd/Developer/peddent-qe-app/src/data/questions.backup.json'

# AAPD topic → URL mapping
AAPD_URLS = {
    'pulp': 'https://www.aapd.org/research/oral-health-policies--recommendations/pulp-therapy/',
    'behavior': 'https://www.aapd.org/research/oral-health-policies--recommendations/behavior-guidance/',
    'sedation': 'https://www.aapd.org/research/oral-health-policies--recommendations/use-of-sedation/',
    'trauma': 'https://www.aapd.org/research/oral-health-policies--recommendations/management-of-traumatic-dental-injuries/',
    'fluoride': 'https://www.aapd.org/research/oral-health-policies--recommendations/fluoride-therapy/',
    'anticipatory': 'https://www.aapd.org/research/oral-health-policies--recommendations/perinatal-and-infant-oral-health/',
    'infant': 'https://www.aapd.org/research/oral-health-policies--recommendations/perinatal-and-infant-oral-health/',
    'perinatal': 'https://www.aapd.org/research/oral-health-policies--recommendations/perinatal-and-infant-oral-health/',
}

# Topic field → URL
TOPIC_URL_MAP = {
    'Pulp Therapy': AAPD_URLS['pulp'],
    'Behavior Guidance': AAPD_URLS['behavior'],
    'Sedation': AAPD_URLS['sedation'],
    'Trauma': AAPD_URLS['trauma'],
    'Prevention': AAPD_URLS['fluoride'],
    'Prevention and Caries Risk Assessment': AAPD_URLS['fluoride'],
}

# Keywords in question/explanation text → URL
KEYWORD_URL_MAP = [
    (re.compile(r'\bpulp\b|\bpulpotomy\b|\bpulpectomy\b|\bindirect pulp\b', re.I), AAPD_URLS['pulp']),
    (re.compile(r'\bsedation\b|\bnitrous\b|\bgeneral anesthesia\b|\bdeep sedation\b', re.I), AAPD_URLS['sedation']),
    (re.compile(r'\btrauma\b|\bluxation\b|\bavulsion\b|\bintrusion\b|\bextrusion\b|\bfracture\b', re.I), AAPD_URLS['trauma']),
    (re.compile(r'\bfluoride\b|\bfluorosis\b|\bfluoride varnish\b', re.I), AAPD_URLS['fluoride']),
    (re.compile(r'\bbehavior\b|\btell.show.do\b|\bvoice control\b|\bprotective stabilization\b|\bhand.over.mouth\b', re.I), AAPD_URLS['behavior']),
    (re.compile(r'\banticipatory guidance\b|\binfant oral\b|\bperinatal\b|\bfirst dental visit\b', re.I), AAPD_URLS['anticipatory']),
]

# Artifact patterns to remove from question text
ARTIFACT_PATTERNS = [
    # Trailing numbers like "1063" or " 1063" at end
    re.compile(r'\s+\d{3,4}\s*$'),
    # "HPV 2" style inline references (but not ages like "6 years")
    re.compile(r'\bHPV\s+\d+\b'),
    # Bullet/circle markers from docx conversion
    re.compile(r'^[•o]\s+', re.MULTILINE),
    # "o a." / "• a." style embedded choice markers
    re.compile(r'[•o]\s+[a-hA-H]\.\s'),
    # Extra whitespace
    re.compile(r'\s{2,}'),
]


def clean_text(text):
    """Remove artifacts from question text."""
    if not text:
        return text
    t = text.strip()
    # Remove trailing numeric artifacts
    t = re.sub(r'\s+\d{3,4}\s*$', '', t).strip()
    # Remove "HPV 2" style references
    t = re.sub(r'\bHPV\s+\d+\b', 'HPV', t)
    # Collapse multiple spaces
    t = re.sub(r'[ \t]{2,}', ' ', t)
    return t


def has_choices(q):
    """Question has at least 3 non-empty answer choices."""
    choices = [q.get('a',''), q.get('b',''), q.get('c',''), q.get('d','')]
    return len([c for c in choices if c and str(c).strip()]) >= 3


def has_answer(q):
    """Question has a correct answer marked."""
    ans = q.get('answer', '')
    return bool(ans and str(ans).strip())


def is_proper_question(q):
    """Question has a proper question stem."""
    text = q.get('question', '')
    if not text:
        return False
    # Markdown-style answers (e.g. "**B) Tell-show-do** *Explanation*...")
    if text.startswith('**'):
        return False
    # Ends with ? → always a question
    if '?' in text:
        return True
    # Long enough to be a clinical scenario
    if len(text) >= 60:
        return True
    return False


def get_source_url(q):
    """Get AAPD source URL based on topic and question content."""
    # Already has a source_url
    if q.get('source_url'):
        return q['source_url']
    
    # Check topic first
    topic = q.get('topic', '')
    if topic in TOPIC_URL_MAP:
        return TOPIC_URL_MAP[topic]
    
    # Check question + explanation text
    combined = (q.get('question', '') + ' ' + q.get('explanation', '')).lower()
    for pattern, url in KEYWORD_URL_MAP:
        if pattern.search(combined):
            return url
    
    return None


def dedup_key(q):
    """Generate dedup key from question text (first 120 chars, lowercased)."""
    return q.get('question', '').lower().strip()[:120]


def main():
    print(f"Loading {INPUT_PATH}...")
    with open(INPUT_PATH, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    original_count = len(questions)
    print(f"Original count: {original_count}")
    
    # Backup
    print(f"Saving backup to {BACKUP_PATH}...")
    with open(BACKUP_PATH, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    # Step 1: Filter
    print("\n--- FILTERING ---")
    filtered = []
    removed_no_choices = 0
    removed_no_answer = 0
    removed_not_question = 0
    
    for q in questions:
        if not is_proper_question(q):
            removed_not_question += 1
            continue
        if not has_choices(q):
            removed_no_choices += 1
            continue
        if not has_answer(q):
            removed_no_answer += 1
            continue
        filtered.append(q)
    
    print(f"Removed (not a proper question): {removed_not_question}")
    print(f"Removed (no answer choices):     {removed_no_choices}")
    print(f"Removed (no correct answer):     {removed_no_answer}")
    print(f"After filtering: {len(filtered)}")
    
    # Step 2: Deduplicate
    print("\n--- DEDUPLICATION ---")
    seen = {}
    dupes = 0
    deduplicated = []
    
    for q in filtered:
        key = dedup_key(q)
        if key in seen:
            dupes += 1
            # Prefer validated questions
            existing = seen[key]
            if q.get('validated') and not existing.get('validated'):
                seen[key] = q
        else:
            seen[key] = q
    
    deduplicated = list(seen.values())
    print(f"Removed duplicates: {dupes}")
    print(f"After dedup: {len(deduplicated)}")
    
    # Step 3: Clean text and add source URLs
    print("\n--- CLEANING & ENRICHING ---")
    urls_added = 0
    texts_cleaned = 0
    
    for q in deduplicated:
        # Clean question text
        orig = q.get('question', '')
        cleaned = clean_text(orig)
        if cleaned != orig:
            q['question'] = cleaned
            texts_cleaned += 1
        
        # Add source URL
        url = get_source_url(q)
        if url:
            q['source_url'] = url
            urls_added += 1
    
    print(f"Texts cleaned: {texts_cleaned}")
    print(f"Source URLs added: {urls_added}")
    
    # Step 4: Renumber IDs and finalize
    print("\n--- FINALIZING ---")
    final = []
    for i, q in enumerate(deduplicated, 1):
        q['id'] = i
        # Clean up empty 'e' field if present
        if 'e' in q and not q['e']:
            del q['e']
        final.append(q)
    
    # Stats
    print(f"\nFinal count: {len(final)}")
    topics = Counter(q.get('topic', 'Unknown') for q in final)
    print("\nTopic distribution:")
    for topic, count in sorted(topics.items(), key=lambda x: -x[1]):
        print(f"  {topic}: {count}")
    
    # Save
    print(f"\nSaving to {OUTPUT_PATH}...")
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(final, f, indent=2, ensure_ascii=False)
    
    print("Done!")
    
    return {
        'original': original_count,
        'removed_not_question': removed_not_question,
        'removed_no_choices': removed_no_choices,
        'removed_no_answer': removed_no_answer,
        'removed_dupes': dupes,
        'texts_cleaned': texts_cleaned,
        'urls_added': urls_added,
        'final': len(final),
        'topics': dict(topics),
    }


if __name__ == '__main__':
    stats = main()
    print(f"\n=== SUMMARY ===")
    print(f"Original: {stats['original']} → Final: {stats['final']}")
    print(f"Reduction: {stats['original'] - stats['final']} questions removed ({(stats['original'] - stats['final'])/stats['original']*100:.1f}%)")
