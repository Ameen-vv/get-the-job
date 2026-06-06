"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { updatePreferences } from "@/lib/actions/preferences.actions";
import type { Preferences } from "@/types";

interface PreferencesFormProps {
  userId: string;
  preferences: Preferences | null;
}

function TagInput({
  label,
  description,
  values,
  onChange,
  placeholder,
  suggestions,
}: {
  label: string;
  description: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");

  function add(val: string) {
    const trimmed = val.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setInput("");
  }

  function remove(val: string) {
    onChange(values.filter((v) => v !== val));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && values.length > 0) {
      remove(values[values.length - 1]);
    }
  }

  const unusedSuggestions = (suggestions ?? []).filter(
    (s) => !values.includes(s)
  );

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <Badge
              key={v}
              variant="secondary"
              className="gap-1 pr-1 pl-2.5 py-1"
            >
              {v}
              <button
                onClick={() => remove(v)}
                className="rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => add(input)}
          disabled={!input.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground self-center">Suggestions:</span>
          {unusedSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PreferencesForm({ userId, preferences }: PreferencesFormProps) {
  const [skills, setSkills] = useState<string[]>(preferences?.skills ?? []);
  const [locations, setLocations] = useState<string[]>(
    preferences?.preferred_locations ?? []
  );
  const [keywords, setKeywords] = useState<string[]>(
    preferences?.preferred_keywords ?? []
  );
  const [remoteOnly, setRemoteOnly] = useState(
    preferences?.remote_only ?? false
  );
  const [topCompanies, setTopCompanies] = useState<string[]>(
    preferences?.top_companies ?? []
  );
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>(
    preferences?.excluded_keywords ?? []
  );
  const [minScore, setMinScore] = useState(preferences?.min_score ?? 4);
  const [maxJobAgeHours, setMaxJobAgeHours] = useState(preferences?.max_job_age_hours ?? 72);
  const [isPending, startTransition] = useTransition();

  const AGE_OPTIONS = [
    { label: "Last 24 hours", value: 24 },
    { label: "Last 3 days", value: 72 },
    { label: "Last week", value: 168 },
    { label: "Last 2 weeks", value: 336 },
  ];

  function handleSave() {
    startTransition(async () => {
      const result = await updatePreferences(userId, {
        skills,
        preferred_locations: locations,
        preferred_keywords: keywords,
        remote_only: remoteOnly,
        top_companies: topCompanies,
        excluded_keywords: excludedKeywords,
        min_score: minScore,
        max_job_age_hours: maxJobAgeHours,
      });

      if (result.success) {
        toast.success("Preferences saved successfully");
      } else {
        toast.error("Failed to save preferences");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>
            Technologies and skills you want to highlight in your search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TagInput
            label="Skills"
            description="Press Enter or comma to add a skill"
            values={skills}
            onChange={setSkills}
            placeholder="e.g. React, TypeScript, Node.js"
            suggestions={["React", "Next.js", "TypeScript", "Node.js", "Python", "AWS", "PostgreSQL", "Docker"]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferred Locations</CardTitle>
          <CardDescription>
            Cities or regions where you want to work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TagInput
            label="Locations"
            description="Press Enter or comma to add a location"
            values={locations}
            onChange={setLocations}
            placeholder="e.g. Remote, Bangalore"
            suggestions={["Remote", "Bangalore", "Chennai", "Hyderabad", "Mumbai", "Pune", "Coimbatore"]}
          />

          <div className="flex items-center gap-3 pt-2">
            <Switch
              id="remote-only"
              checked={remoteOnly}
              onCheckedChange={setRemoteOnly}
            />
            <div>
              <Label htmlFor="remote-only" className="cursor-pointer">
                Remote only
              </Label>
              <p className="text-sm text-muted-foreground">
                Only show remote job opportunities
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keywords</CardTitle>
          <CardDescription>
            Job title keywords you're targeting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TagInput
            label="Keywords"
            description="Press Enter or comma to add a keyword"
            values={keywords}
            onChange={setKeywords}
            placeholder="e.g. Frontend Engineer"
            suggestions={[
              "Frontend Engineer",
              "Software Engineer",
              "Full Stack Engineer",
              "Backend Engineer",
              "React Developer",
              "Senior Engineer",
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Collector Settings</CardTitle>
          <CardDescription>
            Controls what the job collector fetches and how it scores relevance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <TagInput
            label="Top Companies"
            description="Only import jobs from these companies (leave empty to allow all)"
            values={topCompanies}
            onChange={setTopCompanies}
            placeholder="e.g. Google, Swiggy, Atlassian"
            suggestions={["Google", "Microsoft", "Amazon", "Swiggy", "Zomato", "Razorpay", "Atlassian", "Freshworks", "Zoho"]}
          />

          <TagInput
            label="Excluded Keywords"
            description="Drop jobs whose title contains any of these words"
            values={excludedKeywords}
            onChange={setExcludedKeywords}
            placeholder="e.g. intern, manager, director"
            suggestions={["intern", "internship", "fresher", "trainee", "manager", "director", "principal"]}
          />

          <div className="space-y-3">
            <div>
              <Label>Job Recency</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Only fetch jobs posted within this time window
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {AGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMaxJobAgeHours(opt.value)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    maxJobAgeHours === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Minimum Relevance Score</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Jobs scoring below this threshold are dropped — higher means stricter
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                min={1}
                max={10}
                step={1}
                value={[minScore]}
                onValueChange={([v]) => setMinScore(v)}
                className="flex-1"
              />
              <span className="text-sm font-semibold w-6 text-center">{minScore}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Score breakdown: title match (+1–3), location (+1–2), freshness (+1–2), top company (+2), has URL (+1)
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending} size="lg">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
