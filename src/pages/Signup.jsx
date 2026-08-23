import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Instagram,
  Linkedin,
  Globe,
  Check,
  X,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AtSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { DEFAULT_PERMISSIONS } from "@/lib/permissions";
import { saveEmailConfig } from "@/lib/emailConfig";

const COLOR_PRESETS = [
  { name: "Socflow Blue", color: "#2A43F8" },
  { name: "Electric Indigo", color: "#4F46E5" },
  { name: "Royal Violet", color: "#7C3AED" },
  { name: "Emerald Green", color: "#059669" },
  { name: "Sunset Crimson", color: "#E11D48" },
  { name: "Amber Gold", color: "#D97706" },
  { name: "Cyan Sky", color: "#0891B2" },
  { name: "Midnight Minimal", color: "#18181B" },
];

export function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    societyName: "",
    username: "",
    adminName: "",
    email: "",
    password: "",
    confirmPassword: "",
    logoUrl: "",
    coverUrl: "",
    brandingColor: "#2A43F8",
    instagramUrl: "",
    linkedinUrl: "",
    websiteUrl: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate username from society name if username hasn't been manually set
      if (field === "societyName" && !prev.usernameManuallyEdited) {
        updated.username = value
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
      }
      return updated;
    });
  };

  // Password Strength Calculation
  const passwordCriteria = useMemo(() => {
    const pwd = formData.password || "";
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    };
  }, [formData.password]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.length) score += 1;
    if (passwordCriteria.uppercase && passwordCriteria.lowercase) score += 1;
    if (passwordCriteria.number) score += 1;
    if (passwordCriteria.special) score += 1;
    return score; // 0 to 4
  }, [passwordCriteria]);

  const passwordStrengthLabel = useMemo(() => {
    if (!formData.password) return { label: "", color: "" };
    if (passwordScore <= 1) return { label: "Weak", color: "bg-red-500 text-red-500" };
    if (passwordScore === 2) return { label: "Fair", color: "bg-amber-500 text-amber-500" };
    if (passwordScore === 3) return { label: "Good", color: "bg-blue-500 text-blue-500" };
    return { label: "Strong", color: "bg-emerald-500 text-emerald-500" };
  }, [formData.password, passwordScore]);

  // Validation per step
  const validateStep1 = () => {
    if (!formData.societyName.trim()) {
      toast.error("Please enter your Society Name");
      return false;
    }
    if (!formData.username.trim()) {
      toast.error("Please enter a unique Society Username / Handle");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Please enter a valid Society Admin Email");
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit & Auto-Provisioning
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.adminName || formData.societyName,
            society_name: formData.societyName.trim(),
            society_username: formData.username.trim().toLowerCase(),
            role: "admin",
          },
        },
      });

      if (authError) throw authError;

      const userId = authData.user?.id;

      // 2. Create Society Record in `societies` table
      let societyId = null;
      try {
        const { data: societyData } = await supabase
          .from("societies")
          .insert({
            name: formData.societyName.trim(),
            username: formData.username.trim().toLowerCase(),
            email: formData.email.trim(),
            logo_url: formData.logoUrl.trim(),
            cover_url: formData.coverUrl.trim(),
            branding_color: formData.brandingColor,
            instagram_url: formData.instagramUrl.trim() || null,
            linkedin_url: formData.linkedinUrl.trim() || null,
            website_url: formData.websiteUrl.trim() || null,
          })
          .select("id")
          .single();

        if (societyData) societyId = societyData.id;
      } catch (socErr) {
        console.warn("Could not insert into societies table:", socErr);
      }

      // 3. Insert Admin User into `users` table with full permissions
      if (userId) {
        try {
          await supabase.from("users").insert({
            userId: userId,
            user_id: userId,
            email: formData.email.trim(),
            name: formData.adminName.trim() || formData.societyName.trim(),
            role: "admin",
            permissions: JSON.stringify(DEFAULT_PERMISSIONS),
            society_id: societyId,
            society_username: formData.username.trim().toLowerCase(),
          });
        } catch (uErr) {
          console.warn("Could not insert user record:", uErr);
        }
      }

      // 4. Seed Email Template & Branding Config in LocalStorage & app_settings
      await saveEmailConfig({
        brandName: formData.societyName.trim(),
        senderName: `${formData.societyName.trim()} Team`,
        logoUrl: formData.logoUrl.trim(),
        bannerUrl: formData.coverUrl.trim(),
        primaryColor: formData.brandingColor,
        instagramUrl: formData.instagramUrl.trim(),
        linkedinUrl: formData.linkedinUrl.trim(),
        websiteUrl: formData.websiteUrl.trim(),
        supportEmail: formData.email.trim(),
      });

      toast.success("Society registered successfully! Welcome to your dashboard.");
      navigate("/");
    } catch (err) {
      console.error("Signup error:", err);
      toast.error(err.message || "Failed to register society. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-background text-foreground relative">
      {/* Background ambient gradient glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 blur-3xl"
        style={{
          background: `radial-gradient(circle at 50% 20%, ${formData.brandingColor} 0%, transparent 60%)`,
        }}
      />

      <div className="w-full max-w-2xl relative z-10">
        <Card className="rounded-3xl bg-card/85 border border-border/60 shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Card Header with Progress Steps */}
          <CardHeader className="text-center pb-4 border-b border-border/40 bg-muted/20">
            <CardTitle
              className="text-2xl sm:text-3xl font-extrabold tracking-tight font-recoleta mb-1"
              style={{
                backgroundImage: "linear-gradient(45deg,#2A43F8 24%, #2A43F8 50%, #4482ff 91%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Register Your Society
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              Create your official chapter account, setup branding, and invite your team
            </CardDescription>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 mt-5">
              {[
                { num: 1, label: "Account & Identity" },
                { num: 2, label: "Branding & Assets" },
                { num: 3, label: "Social Links" },
              ].map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (s.num < step || validateStep1()) setStep(s.num);
                  }}
                  className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    step === s.num
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : step > s.num
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="size-5 rounded-full bg-background/20 flex items-center justify-center text-[10px]">
                    {step > s.num ? <Check className="size-3" /> : s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            <form
              onSubmit={
                step === 3
                  ? handleSubmit
                  : (e) => {
                      e.preventDefault();
                      handleNext();
                    }
              }
            >
              {/* STEP 1: Account & Society Identity */}
              {step === 1 && (
                <div className="space-y-4 text-left animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Society Name */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label
                        htmlFor="societyName"
                        className="text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Building2 className="size-3.5 text-primary" />
                        Society / Chapter Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="societyName"
                        placeholder="Enter your society or organization name"
                        value={formData.societyName}
                        onChange={(e) => handleChange("societyName", e.target.value)}
                        required
                        className="h-10"
                      />
                    </div>

                    {/* Society Username */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="username"
                        className="text-xs font-semibold flex items-center gap-1.5"
                      >
                        <AtSign className="size-3.5 text-primary" />
                        Society Handle / Slug <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="username"
                        placeholder="e.g. tech-society, ai-club"
                        value={formData.username}
                        onChange={(e) => {
                          setFormData((p) => ({
                            ...p,
                            username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                            usernameManuallyEdited: true,
                          }));
                        }}
                        required
                        className="h-10 font-mono text-xs"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Used for portal URLs & identifier
                      </p>
                    </div>

                    {/* Admin Contact Email */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="email"
                        className="text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Mail className="size-3.5 text-primary" />
                        Society Admin Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="society@university.edu or contact@domain.org"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        required
                        className="h-10"
                      />
                    </div>

                    {/* Admin Full Name */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="adminName" className="text-xs font-semibold">
                        Admin / Lead Full Name (Optional)
                      </Label>
                      <Input
                        id="adminName"
                        placeholder="Enter lead administrator's full name"
                        value={formData.adminName}
                        onChange={(e) => handleChange("adminName", e.target.value)}
                        className="h-10"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="password"
                        className="text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Lock className="size-3.5 text-primary" />
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 8 characters"
                          value={formData.password}
                          onChange={(e) => handleChange("password", e.target.value)}
                          required
                          className="h-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {formData.password && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Strength:</span>
                            <span
                              className={`font-semibold ${passwordStrengthLabel.color.split(" ")[1]}`}
                            >
                              {passwordStrengthLabel.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 h-1.5 rounded-full overflow-hidden bg-muted">
                            <div
                              className={`h-full transition-all ${
                                passwordScore >= 1
                                  ? passwordStrengthLabel.color.split(" ")[0]
                                  : "bg-transparent"
                              }`}
                            />
                            <div
                              className={`h-full transition-all ${
                                passwordScore >= 2
                                  ? passwordStrengthLabel.color.split(" ")[0]
                                  : "bg-transparent"
                              }`}
                            />
                            <div
                              className={`h-full transition-all ${
                                passwordScore >= 3
                                  ? passwordStrengthLabel.color.split(" ")[0]
                                  : "bg-transparent"
                              }`}
                            />
                            <div
                              className={`h-full transition-all ${
                                passwordScore >= 4
                                  ? passwordStrengthLabel.color.split(" ")[0]
                                  : "bg-transparent"
                              }`}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-xs font-semibold flex items-center gap-1.5"
                      >
                        <ShieldCheck className="size-3.5 text-primary" />
                        Confirm Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleChange("confirmPassword", e.target.value)}
                          required
                          className="h-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                      {formData.confirmPassword && (
                        <p
                          className={`text-[11px] flex items-center gap-1 ${
                            formData.password === formData.confirmPassword
                              ? "text-emerald-600"
                              : "text-red-500"
                          }`}
                        >
                          {formData.password === formData.confirmPassword ? (
                            <>
                              <Check className="size-3" /> Passwords match
                            </>
                          ) : (
                            <>
                              <X className="size-3" /> Passwords do not match
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Branding, Logo & Cover Image */}
              {step === 2 && (
                <div className="space-y-5 text-left animate-in fade-in duration-200">
                  {/* Branding Color Picker & Presets */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Palette className="size-3.5 text-primary" />
                        Society Primary Branding Color
                      </span>
                      <span className="font-mono text-xs text-muted-foreground font-normal">
                        {formData.brandingColor}
                      </span>
                    </Label>

                    <div className="flex flex-wrap items-center gap-2">
                      {COLOR_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleChange("brandingColor", p.color)}
                          className={`size-7 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                            formData.brandingColor.toLowerCase() === p.color.toLowerCase()
                              ? "border-foreground scale-110 shadow-md"
                              : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: p.color }}
                          title={p.name}
                        >
                          {formData.brandingColor.toLowerCase() === p.color.toLowerCase() && (
                            <Check className="size-3.5 text-white drop-shadow-sm" />
                          )}
                        </button>
                      ))}

                      {/* Custom Hex Color Picker */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <input
                          type="color"
                          value={formData.brandingColor}
                          onChange={(e) => handleChange("brandingColor", e.target.value)}
                          className="size-8 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                        />
                        <Input
                          value={formData.brandingColor}
                          onChange={(e) => handleChange("brandingColor", e.target.value)}
                          className="w-24 h-8 font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo Link */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="logoUrl"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <ImageIcon className="size-3.5 text-primary" />
                      Society Logo URL (Square 1:1 format)
                    </Label>
                    <Input
                      id="logoUrl"
                      placeholder="https://example.com/logo.png"
                      value={formData.logoUrl}
                      onChange={(e) => handleChange("logoUrl", e.target.value)}
                      className="h-10 text-xs font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Recommended: Transparent PNG or SVG (512 × 512 px)
                    </p>
                  </div>

                  {/* Cover / Banner Link */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="coverUrl"
                      className="text-xs font-semibold flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-primary" />
                        Cover / Banner Image Link
                      </span>
                      <span className="text-[11px] text-primary font-medium">
                        Recommended: 1200 × 400 px (3:1)
                      </span>
                    </Label>
                    <Input
                      id="coverUrl"
                      placeholder="https://example.com/banner.jpg"
                      value={formData.coverUrl}
                      onChange={(e) => handleChange("coverUrl", e.target.value)}
                      className="h-10 text-xs font-mono"
                    />
                  </div>

                  {/* Live Society Card Mini Preview */}
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Live Society Card Preview
                    </Label>
                    <div className="rounded-2xl border border-border/80 overflow-hidden bg-card/60 shadow-md">
                      {/* Cover Banner */}
                      <div className="w-full h-24 sm:h-28 bg-muted relative overflow-hidden">
                        {formData.coverUrl ? (
                          <img
                            src={formData.coverUrl}
                            alt="Cover Banner"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: formData.brandingColor, opacity: 0.8 }}
                          />
                        )}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))`,
                          }}
                        />
                      </div>

                      {/* Info & Logo */}
                      <div className="p-4 flex items-center gap-4 relative">
                        <div className="size-14 rounded-xl border-2 border-background bg-white shadow-md overflow-hidden shrink-0 flex items-center justify-center -mt-8 relative z-10">
                          {formData.logoUrl ? (
                            <img
                              src={formData.logoUrl}
                              alt="Logo"
                              className="size-full object-contain p-1"
                              onError={(e) => {
                                e.target.src = "";
                              }}
                            />
                          ) : (
                            <Building2 className="size-6 text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm sm:text-base truncate text-foreground">
                            {formData.societyName || "Society Name"}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            @{formData.username || "society-handle"}
                          </p>
                        </div>

                        <div
                          className="size-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: formData.brandingColor }}
                          title="Brand Color"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Social & Web Links (Optional) */}
              {step === 3 && (
                <div className="space-y-4 text-left animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground leading-relaxed">
                    Social links will automatically be attached to your official email template
                    footers and public event portals.
                  </div>

                  {/* Instagram */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="instagramUrl"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Instagram className="size-3.5 text-pink-500" />
                      Instagram Profile URL (Optional)
                    </Label>
                    <Input
                      id="instagramUrl"
                      placeholder="https://instagram.com/your_handle"
                      value={formData.instagramUrl}
                      onChange={(e) => handleChange("instagramUrl", e.target.value)}
                      className="h-10 text-xs"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="linkedinUrl"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Linkedin className="size-3.5 text-blue-600" />
                      LinkedIn Page URL (Optional)
                    </Label>
                    <Input
                      id="linkedinUrl"
                      placeholder="https://linkedin.com/company/your-society"
                      value={formData.linkedinUrl}
                      onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                      className="h-10 text-xs"
                    />
                  </div>

                  {/* Website */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="websiteUrl"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Globe className="size-3.5 text-emerald-500" />
                      Official Website / Linktree URL (Optional)
                    </Label>
                    <Input
                      id="websiteUrl"
                      placeholder="https://your-society-website.org"
                      value={formData.websiteUrl}
                      onChange={(e) => handleChange("websiteUrl", e.target.value)}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-3 pt-6 border-t border-border/50 mt-6">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={loading}
                    className="gap-1.5 cursor-pointer h-10 px-4"
                  >
                    <ArrowLeft className="size-4" /> Back
                  </Button>
                ) : (
                  <Link to="/login">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      Already have an account? Sign In
                    </Button>
                  </Link>
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-1.5 cursor-pointer ml-auto h-10 px-5 font-semibold bg-primary text-primary-foreground"
                  >
                    Next Step <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="gap-2 cursor-pointer ml-auto h-10 px-6 font-semibold bg-primary text-primary-foreground shadow-md"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Creating Society...
                      </>
                    ) : (
                      <>
                        <Building2 className="size-4" />
                        Complete Registration
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Subtext */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          By registering, you agree to administer your society in accordance with campus and
          community guidelines.
        </p>
      </div>
    </div>
  );
}

export default Signup;
