"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Camera, KeyRound, UserRound } from "lucide-react";
import { TrainerDashboardShell } from "@/components/shared/trainer";
import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api";
import { useAuth, useToast } from "@/contexts";
import { apiClient } from "@/lib";

const normalizeProfileImageUrl = (path?: string | null): string => {
  if (!path) return "";
  const i = path.indexOf("/uploads/");
  return i >= 0 ? `/assets/${path.slice(i + "/uploads/".length)}` : path;
};

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
};

export default function TrainerProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
    setPhone(user.phone ?? "");
    setBio(user.bio ?? "");
    setProfilePicture(normalizeProfileImageUrl(user.profilePicture));
  }, [user]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { firstName, lastName } = splitName(fullName);
      await apiClient.put(API_ENDPOINTS.auth.profile, {
        firstName,
        ...(lastName ? { lastName } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(address.trim() ? { address: address.trim() } : {}),
        ...(bio.trim() ? { bio: bio.trim() } : {}),
      });
      await refreshUser();
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("profileImage", file);
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.uploadProfileImage}`, {
        method: "POST",
        headers: apiClient.getAuthToken() ? { Authorization: `Bearer ${apiClient.getAuthToken()}` } : {},
        body: form,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message ?? "Unable to upload photo.");
      setProfilePicture(normalizeProfileImageUrl(result.data?.profilePicture));
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refreshUser();
      toast.success("Profile photo updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to upload photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendCode = async () => {
    if (!user?.email) return;
    setIsSendingCode(true);
    try {
      await apiClient.post(API_ENDPOINTS.auth.forgotPassword, { email: user.email });
      toast.success("Verification code sent to your email.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to send verification code.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const displayName = fullName || user?.email?.split("@")[0] || "trainer";
  const initial = (user?.firstName || user?.email || "T")[0].toUpperCase();
  const isActive = user?.isActive !== false;

  return (
    <TrainerDashboardShell>
      <div className="profile-page-wrap">
        <div className="profile-banner">
          <div className="profile-avatar-row">
            <div
              className="profile-avatar-wrap"
              onClick={() => fileInputRef.current?.click()}
              style={{ borderRadius: "50%", cursor: "pointer" }}
            >
              <div className="profile-avatar-circle">
                {profilePicture
                  ? <img src={profilePicture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span>{initial}</span>
                }
              </div>
            </div>
            <div className="profile-banner-meta">
              <strong>{displayName}</strong>
              <span>{user?.email}</span>
              <div className="profile-badges">
                <span className="profile-badge profile-badge-role">Trainer</span>
                <span className={`profile-badge ${isActive ? "profile-badge-active" : "profile-badge-inactive"}`}>
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="profile-change-photo-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Camera size={13} aria-hidden="true" />
              {isUploading ? "Uploading..." : "Change photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="profile-hidden-input"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }}
              disabled={isUploading}
            />
          </div>
        </div>

        <div className="profile-section-card">
          <h3 className="profile-section-title">
            <UserRound size={15} aria-hidden="true" />
            Personal information
          </h3>
          <form onSubmit={handleSave}>
            <div className="profile-form-grid">
              <label className="profile-form-label">
                Full name
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="profile-form-input" disabled={isSaving} autoComplete="name" />
              </label>
              <label className="profile-form-label">
                Email
                <input type="email" value={user?.email ?? ""} readOnly className="profile-form-input profile-input-readonly" />
              </label>
              <label className="profile-form-label">
                Phone
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="profile-form-input" disabled={isSaving} autoComplete="tel" />
              </label>
              <label className="profile-form-label">
                Address
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="profile-form-input" disabled={isSaving} placeholder="City, Country" />
              </label>
              <label className="profile-form-label profile-form-full">
                Bio
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="profile-form-input profile-form-textarea" disabled={isSaving} placeholder="Tell clients about your training philosophy and experience..." maxLength={500} />
              </label>
            </div>
            <button type="submit" className="profile-save-btn" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        <div className="profile-section-card profile-section-last">
          <h3 className="profile-section-title">
            <KeyRound size={15} aria-hidden="true" />
            Password &amp; security
          </h3>
          <p className="profile-security-desc">
            To change your password, we'll email a one-time verification code to{" "}
            <strong>{user?.email}</strong> to confirm it's you.
          </p>
          <button type="button" className="profile-send-code-btn" onClick={handleSendCode} disabled={isSendingCode}>
            {isSendingCode ? "Sending..." : "Send verification code"}
          </button>
        </div>
      </div>
    </TrainerDashboardShell>
  );
}
