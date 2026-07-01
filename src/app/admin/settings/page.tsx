"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Plus, Save, User } from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts";
import { apiClient } from "@/lib";

const normalizeProfileImageUrl = (path?: string | null) => {
  if (!path) {
    return "";
  }

  const uploadsIndex = path.indexOf("/uploads/");
  if (uploadsIndex >= 0) {
    return `/assets/${path.slice(uploadsIndex + "/uploads/".length)}`;
  }

  return path;
};

const splitDisplayName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
};

export default function AdminSettingsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(`${user.firstName || ""} ${user.lastName || ""}`.trim() || "admin");
    setPhone(user.phone || "");
    setProfilePicture(normalizeProfileImageUrl(user.profilePicture));
  }, [user]);

  const selectedPhotoLabel = selectedPhoto?.name || "No file chosen";

  const handleProfileUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const { firstName, lastName } = splitDisplayName(name);

      await apiClient.put(API_ENDPOINTS.auth.profile, {
        firstName,
        ...(lastName ? { lastName } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });

      await refreshUser();
      toast.success("Admin profile updated successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update admin profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) {
      toast.error("Please choose a profile picture before uploading.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("profileImage", selectedPhoto);

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.uploadProfileImage}`, {
        method: "POST",
        headers: {
          ...(apiClient.getAuthToken() ? { Authorization: `Bearer ${apiClient.getAuthToken()}` } : {}),
        },
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to upload profile picture.");
      }

      setProfilePicture(normalizeProfileImageUrl(result.data?.profilePicture));
      setSelectedPhoto(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await refreshUser();
      toast.success("Profile picture uploaded successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to upload profile picture.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="admin-settings-page">
      <header className="admin-settings-header">
        <h1>Settings</h1>
        <p>Manage your admin account.</p>
      </header>

      {message ? <p className="admin-products-message">{message}</p> : null}
      {error ? <p className="admin-products-message error">{error}</p> : null}

      <section className="admin-settings-card">
        <h2>
          <User aria-hidden="true" />
          Admin Profile
        </h2>

        <div className="admin-settings-profile-layout">
          <div className="admin-settings-photo-block">
            <div className="admin-settings-avatar">
              {profilePicture ? <img src={profilePicture} alt="" /> : <User aria-hidden="true" />}
            </div>
            <div className="admin-upload-field">
              <span>Upload profile picture</span>
              <button
                type="button"
                className="admin-upload-drop"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Choose admin profile picture"
              >
                <Plus aria-hidden="true" />
              </button>
              <input
                ref={fileInputRef}
                className="admin-hidden-file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={isUploading}
                onChange={(event) => setSelectedPhoto(event.target.files?.[0] || null)}
              />
              <small>
                Choose files <span>{selectedPhotoLabel}</span>
              </small>
              <button type="button" className="admin-upload-picture-button" disabled={isUploading} onClick={handlePhotoUpload}>
                {isUploading ? "Uploading..." : "Upload Picture"}
              </button>
            </div>
          </div>

          <form className="admin-settings-form" onSubmit={handleProfileUpdate}>
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              Email
              <input value={user?.email || ""} readOnly />
            </label>
            <label>
              Phone
              <input value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
            <button type="submit" disabled={isSaving}>
              <Save aria-hidden="true" />
              {isSaving ? "Updating..." : "Update Profile"}
            </button>
          </form>
        </div>
      </section>
    </section>
  );
}
