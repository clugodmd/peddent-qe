import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Type, RotateCcw, Download, Upload, LogOut, Lock, Mail } from 'lucide-react';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { useProgressStore } from '../store/progressStore';
import { downloadProgress, uploadProgress } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';

export const Settings = () => {
  const navigate = useNavigate();
  const { user, logOut } = useAuth();
  const settings = useProgressStore((state) => state.settings);
  const updateSettings = useProgressStore((state) => state.updateSettings);
  const resetAllProgress = useProgressStore((state) => state.resetAllProgress);
  const progress = useProgressStore((state) => state.progress);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [resetEmailLoading, setResetEmailLoading] = useState(false);
  const [resetEmailMessage, setResetEmailMessage] = useState('');

  const handleFontSize = (size) => {
    updateSettings({ fontSize: size });
    document.documentElement.style.fontSize = size === 'small' ? '14px' : size === 'normal' ? '16px' : '18px';
  };

  const handleReset = () => {
    resetAllProgress();
    setShowResetConfirm(false);
    alert('All progress has been reset');
  };

  const handleDownloadProgress = () => {
    downloadProgress(progress);
  };

  const handleUploadProgress = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await uploadProgress(file);
      localStorage.setItem('peddent_progress', JSON.stringify(data));
      setUploadMessage('Progress imported successfully!');
      setTimeout(() => setUploadMessage(''), 3000);
      window.location.reload();
    } catch (error) {
      alert('Failed to import progress: ' + error.message);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage('');
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setPasswordMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordError('Current password is incorrect.');
      } else {
        setPasswordError(err.message || 'Failed to update password.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    setResetEmailMessage('');
    setResetEmailLoading(true);
    try {
      await resetPassword(user.email);
      setResetEmailMessage(`Reset email sent to ${user.email}`);
    } catch (err) {
      setResetEmailMessage('Failed to send reset email. Try again.');
    } finally {
      setResetEmailLoading(false);
    }
  };

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Large' }
  ];

  return (
    <div className="min-h-screen bg-navy-900 pb-32">
      <Header title="Settings" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Display Settings */}
        <div className="bg-navy-800 rounded-xl p-6 mb-6 border border-navy-700">
          <h2 className="text-xl font-bold text-gray-100 mb-6">Display Settings</h2>

          {/* Dark Mode */}
          <div className="mb-6 pb-6 border-b border-navy-700">
            <label className="flex items-center justify-between">
              <span className="flex items-center gap-3 text-gray-200 font-semibold">
                {settings.darkMode ? (
                  <Moon size={20} className="text-blue-400" />
                ) : (
                  <Sun size={20} className="text-yellow-400" />
                )}
                Dark Mode
              </span>
              <button
                onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                className={`
                  relative w-12 h-6 rounded-full transition-colors
                  ${settings.darkMode ? 'bg-blue-600' : 'bg-gray-600'}
                `}
              >
                <div
                  className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                    ${settings.darkMode ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </label>
          </div>

          {/* Font Size */}
          <div>
            <label className="flex items-center gap-3 text-gray-200 font-semibold mb-4">
              <Type size={20} />
              Font Size
            </label>
            <div className="grid grid-cols-3 gap-3">
              {fontSizeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFontSize(option.value)}
                  className={`
                    p-3 rounded-lg transition-all font-semibold
                    ${
                      settings.fontSize === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-navy-700 text-gray-300 hover:bg-navy-600'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-navy-800 rounded-xl p-6 mb-6 border border-navy-700">
          <h2 className="text-xl font-bold text-gray-100 mb-6">Data Management</h2>

          {/* Export */}
          <div className="mb-6 pb-6 border-b border-navy-700">
            <p className="text-sm text-gray-400 mb-4">
              Download your progress data as JSON. You can import it later on any device.
            </p>
            <Button
              onClick={handleDownloadProgress}
              variant="secondary"
              size="lg"
              className="w-full flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Export Progress
            </Button>
          </div>

          {/* Import */}
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-4">
              Import previously exported progress data to restore your studies.
            </p>
            <label className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-navy-600 cursor-pointer hover:border-blue-500 hover:bg-blue-600/10 transition-all">
              <Upload size={20} className="text-gray-400" />
              <span className="text-gray-300 font-semibold">Import Progress</span>
              <input
                type="file"
                accept=".json"
                onChange={handleUploadProgress}
                className="hidden"
              />
            </label>
            {uploadMessage && (
              <p className="text-green-400 text-sm mt-2">{uploadMessage}</p>
            )}
          </div>
        </div>

        {/* App Information */}
        <div className="bg-navy-800 rounded-xl p-6 mb-6 border border-navy-700">
          <h2 className="text-xl font-bold text-gray-100 mb-6">App Information</h2>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-400">Version</p>
              <p className="text-gray-200 font-semibold">1.0.0</p>
            </div>

            <div>
              <p className="text-gray-400">Total Questions</p>
              <p className="text-gray-200 font-semibold">4,888</p>
            </div>

            <div>
              <p className="text-gray-400">Questions Attempted</p>
              <p className="text-gray-200 font-semibold">
                {Object.values(progress).filter((p) => p.attempts > 0).length}
              </p>
            </div>

            <div>
              <p className="text-gray-400">Data Storage</p>
              <p className="text-gray-200 font-semibold">Browser LocalStorage (Offline)</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-600/10 rounded-xl p-6 border border-red-500/50">
          <h2 className="text-xl font-bold text-red-400 mb-6">Danger Zone</h2>

          {!showResetConfirm && (
            <Button
              onClick={() => setShowResetConfirm(true)}
              variant="danger"
              size="lg"
              className="w-full flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              Reset All Progress
            </Button>
          )}

          {showResetConfirm && (
            <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-200 font-semibold mb-4">
                Are you sure? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleReset}
                  variant="danger"
                  size="lg"
                  className="flex-1"
                >
                  Yes, Reset All
                </Button>
                <Button
                  onClick={() => setShowResetConfirm(false)}
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-navy-800 rounded-xl p-6 mt-6 border border-navy-700">
          <h2 className="text-xl font-bold text-gray-100 mb-2 flex items-center gap-2">
            <Lock size={20} className="text-blue-400" />
            Change Password
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Update your account password. You'll need to enter your current password first.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {passwordError && (
              <p className="text-red-400 text-sm font-medium">{passwordError}</p>
            )}
            {passwordMessage && (
              <p className="text-green-400 text-sm font-medium">{passwordMessage}</p>
            )}

            <button
              onClick={handleChangePassword}
              disabled={passwordLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              <Lock size={18} />
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-navy-700">
            <p className="text-sm text-gray-400 mb-3">
              Can't remember your current password? Send a reset link to your email.
            </p>
            <button
              onClick={handleSendResetEmail}
              disabled={resetEmailLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-navy-700 hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 font-semibold transition-colors border border-navy-600"
            >
              <Mail size={18} />
              {resetEmailLoading ? 'Sending...' : 'Send Password Reset Email'}
            </button>
            {resetEmailMessage && (
              <p className="text-blue-400 text-sm mt-2 text-center">{resetEmailMessage}</p>
            )}
          </div>
        </div>

        {/* Account */}
        <div className="bg-navy-800 rounded-xl p-6 mt-6 border border-navy-700">
          <h2 className="text-xl font-bold text-gray-100 mb-4">Account</h2>
          <p className="text-sm text-gray-400 mb-4">
            Signed in as <span className="text-gray-200 font-medium">{user?.email}</span>
          </p>
          <button
            onClick={logOut}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-900/30 hover:bg-red-900/50 text-red-400 font-semibold transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>PedBoards QE v1.0.0</p>
          <p className="mt-1">A Progressive Web App for Pediatric Dental Board Exam Preparation</p>
        </div>
      </div>
    </div>
  );
};
