"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";

interface FilterPanelProps {
  domains: Array<{ id: string; title: string }>;
  categories: Array<{ id: string; title: string; domainId: string }>;
  skills: Array<{ id: string; title: string; categoryId: string }>;
  selectedDomainId?: string;
  selectedCategoryId?: string;
  selectedSkillId?: string;
  selectedStatus?: string;
  dueOnly?: boolean;
  searchQuery?: string;
  onDomainChange: (domainId: string | undefined) => void;
  onCategoryChange: (categoryId: string | undefined) => void;
  onSkillChange: (skillId: string | undefined) => void;
  onStatusChange: (status: string | undefined) => void;
  onDueOnlyChange: (dueOnly: boolean) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

export function FilterPanel({
  domains,
  categories,
  skills,
  selectedDomainId,
  selectedCategoryId,
  selectedSkillId,
  selectedStatus,
  dueOnly,
  searchQuery,
  onDomainChange,
  onCategoryChange,
  onSkillChange,
  onStatusChange,
  onDueOnlyChange,
  onSearchChange,
  onClearFilters,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredCategories = selectedDomainId
    ? categories.filter((c) => c.domainId === selectedDomainId)
    : categories;

  const filteredSkills = selectedCategoryId
    ? skills.filter((s) => s.categoryId === selectedCategoryId)
    : skills;

  const hasActiveFilters =
    selectedDomainId ||
    selectedCategoryId ||
    selectedSkillId ||
    selectedStatus ||
    dueOnly ||
    searchQuery;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <CardDescription>
              Customize your study session
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Hide" : "Show"}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Cards</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search questions, answers..."
                value={searchQuery || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Domain Filter */}
          <div className="space-y-2">
            <Label>Domain</Label>
            <Select
              value={selectedDomainId || "all"}
              onValueChange={(value) =>
                onDomainChange(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All domains</SelectItem>
                {domains.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={selectedCategoryId || "all"}
              onValueChange={(value) =>
                onCategoryChange(value === "all" ? undefined : value)
              }
              disabled={!selectedDomainId}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skill Filter */}
          <div className="space-y-2">
            <Label>Skill</Label>
            <Select
              value={selectedSkillId || "all"}
              onValueChange={(value) =>
                onSkillChange(value === "all" ? undefined : value)
              }
              disabled={!selectedCategoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder="All skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All skills</SelectItem>
                {filteredSkills.map((skill) => (
                  <SelectItem key={skill.id} value={skill.id}>
                    {skill.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Progress Status</Label>
            <Select
              value={selectedStatus || "all"}
              onValueChange={(value) =>
                onStatusChange(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cards</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="learning">Learning</SelectItem>
                <SelectItem value="known">Known</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Only Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="due-only">Due for review only</Label>
            <Button
              id="due-only"
              variant={dueOnly ? "default" : "outline"}
              size="sm"
              onClick={() => onDueOnlyChange(!dueOnly)}
            >
              {dueOnly ? "On" : "Off"}
            </Button>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onClearFilters}
            >
              <X className="mr-2 h-4 w-4" />
              Clear All Filters
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
