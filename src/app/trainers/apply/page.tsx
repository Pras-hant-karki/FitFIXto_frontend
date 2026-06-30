"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { Award, Camera, FileText, Upload } from "lucide-react";
import { submitTrainerApplication, uploadTrainerApplicationFiles } from "@/features/trainers/api";

type ApplicationForm = {
  firstName: string; lastName: string; email: string; phone: string; location: string;
  sessionRate: string; experienceYears: string; specialties: string; certifications: string; bio: string;
};

const initialForm: ApplicationForm = {
  firstName: "", lastName: "", email: "", phone: "", location: "", sessionRate: "",
  experienceYears: "", specialties: "", certifications: "", bio: "",
};

const toList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

export default function TrainerApplicationPage() {
  const [form, setForm] = useState(initialForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const photoInput = useRef<HTMLInputElement | null>(null);
  const certificateInput = useRef<HTMLInputElement | null>(null);

  const updateField = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const uploaded = photo || certificateFiles.length
        ? await uploadTrainerApplicationFiles(photo, certificateFiles)
        : { photo: null, certificates: [] };

      await submitTrainerApplication({
        ...form,
        sessionRate: Number(form.sessionRate),
        experienceYears: Number(form.experienceYears),
        specialties: toList(form.specialties),
        certifications: toList(form.certifications),
        certificationFiles: uploaded.certificates,
        profilePicture: uploaded.photo || undefined,
      });

      setSuccess(true);
      setForm(initialForm);
      setPhoto(null);
      setCertificateFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit trainer application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="trainer-application-page">
        <section className="trainer-application-success">
          <Award aria-hidden="true" />
          <h1>Application received</h1>
          <p>The FitFIXto admin team will review your details. Approval does not create a public trainer account until admin completes your profile and credentials.</p>
          <a className="button button-dark" href="/trainers">Back to Trainers</a>
        </section>
      </main>
    );
  }

  return (
    <main className="trainer-application-page">
      <header className="trainer-application-heading">
        <span>JOIN FITFIXTO</span>
        <h1>Apply to become a trainer</h1>
        <p>Tell us about your coaching experience. Your application and documents will be reviewed by the FitFIXto admin team.</p>
      </header>

      <form className="trainer-application-form" onSubmit={handleSubmit}>
        {error ? <p className="form-error trainer-application-wide">{error}</p> : null}

        <section className="trainer-application-upload trainer-application-wide">
          <div className="trainer-application-upload-title"><Camera aria-hidden="true" /><strong>Upload your photo</strong></div>
          <button type="button" className="trainer-file-picker" onClick={() => photoInput.current?.click()}>
            <Upload aria-hidden="true" /><span>{photo?.name || "Choose profile photo"}</span>
          </button>
          <input ref={photoInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
        </section>

        <label><span>First Name</span><input name="firstName" value={form.firstName} onChange={updateField} required /></label>
        <label><span>Last Name</span><input name="lastName" value={form.lastName} onChange={updateField} required /></label>
        <label><span>Email</span><input name="email" type="email" value={form.email} onChange={updateField} required /></label>
        <label><span>Phone</span><input name="phone" value={form.phone} onChange={updateField} required /></label>
        <label><span>Location</span><input name="location" value={form.location} onChange={updateField} required /></label>
        <label><span>Session rate (hourly)</span><input name="sessionRate" type="number" min="0" value={form.sessionRate} onChange={updateField} required /></label>
        <label><span>Experience Years</span><input name="experienceYears" type="number" min="0" step="1" value={form.experienceYears} onChange={updateField} required /></label>
        <label><span>Specialities</span><input name="specialties" value={form.specialties} onChange={updateField} placeholder="Strength, mobility, nutrition" required /></label>
        <label className="trainer-application-wide"><span>Certifications</span><input name="certifications" value={form.certifications} onChange={updateField} placeholder="NASM CPT, ACE CPT" required /></label>

        <section className="trainer-application-upload trainer-application-wide">
          <div className="trainer-application-upload-title"><FileText aria-hidden="true" /><strong>Upload certification</strong></div>
          <button type="button" className="trainer-file-picker" onClick={() => certificateInput.current?.click()}>
            <Upload aria-hidden="true" /><span>{certificateFiles.length ? `${certificateFiles.length} file(s) selected` : "Choose up to 5 certificates"}</span>
          </button>
          <input ref={certificateInput} hidden type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => setCertificateFiles(Array.from(event.target.files || []).slice(0, 5))} />
          {certificateFiles.length ? <small>{certificateFiles.map((file) => file.name).join(", ")}</small> : null}
        </section>

        <label className="trainer-application-wide"><span>Bio/About you</span><textarea name="bio" rows={6} maxLength={500} value={form.bio} onChange={updateField} required /></label>
        <aside className="trainer-renewal-notice trainer-application-wide">After you are approved as a trainer, there will be a yearly renewal charge to remain a FitFIXto trainer.</aside>
        <button className="button trainer-application-submit trainer-application-wide" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting application..." : "Apply"}
        </button>
      </form>
    </main>
  );
}
