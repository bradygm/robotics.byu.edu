"use client";

import { useMemo, useState } from "react";
import { FiChevronDown, FiExternalLink } from "react-icons/fi";
import type { Course } from "@/utils/types";

type Level = "undergraduate" | "graduate";
type GroupBy = "level" | "department";
type LevelFilter = Level | "all";

type Listing = {
  code: string;
  department: string;
  number: number;
};

type CourseEntry = Course & {
  listings: Listing[];
  level: Level;
};

type CourseRow = {
  course: CourseEntry;
  // Ordered so the listing for the current section comes first.
  listings: Listing[];
};

type CourseSection = {
  title: string;
  rows: CourseRow[];
};

type CourseListProps = {
  courses: Course[];
};

const departmentNames: Record<string, string> = {
  CS: "Computer Science",
  ECE: "Electrical & Computer Engineering",
  ME: "Mechanical Engineering",
};

const levelNames: Record<Level, string> = {
  undergraduate: "Undergraduate",
  graduate: "Graduate",
};

const groupOptions: { value: GroupBy; label: string }[] = [
  { value: "level", label: "Level" },
  { value: "department", label: "Department" },
];

// BYU numbers graduate courses 500 and above.
const firstGraduateNumber = 500;

// Splits a course number such as "ECE 483 / ME 431" into its cross-listings.
function parseListings(courseNumber: string): Listing[] {
  return courseNumber.split("/").map((part) => {
    const code = part.trim();
    const [, department = code, number = "0"] = code.match(/^(.+?)\s*(\d+)/) ?? [];

    return { code, department, number: Number(number) };
  });
}

// Puts the department's listing first so a cross-listed course reads and sorts by it.
function leadWith(listings: Listing[], department: string) {
  const lead = listings.find((listing) => listing.department === department);

  return lead ? [lead, ...listings.filter((listing) => listing !== lead)] : listings;
}

function compareRows(first: CourseRow, second: CourseRow) {
  return first.listings[0].number - second.listings[0].number ||
    first.listings[0].department.localeCompare(second.listings[0].department);
}

export default function CourseList({ courses }: CourseListProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("level");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

  const entries = useMemo<CourseEntry[]>(() => courses.map((course) => {
    const listings = parseListings(course.courseNumber);
    const level = listings[0].number >= firstGraduateNumber ? "graduate" : "undergraduate";

    return { ...course, listings, level };
  }), [courses]);

  const departments = useMemo(
    () => [...new Set(entries.flatMap((course) => course.listings.map((listing) => listing.department)))].sort(),
    [entries],
  );

  const filteredCourses = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    return entries.filter((course) => {
      const matchesSearch = !normalizedQuery ||
        course.title.toLocaleLowerCase().includes(normalizedQuery) ||
        course.courseNumber.toLocaleLowerCase().includes(normalizedQuery) ||
        course.summary.toLocaleLowerCase().includes(normalizedQuery);
      const matchesDepartment = departmentFilter === "all" ||
        course.listings.some((listing) => listing.department === departmentFilter);
      const matchesLevel = levelFilter === "all" || course.level === levelFilter;

      return matchesSearch && matchesDepartment && matchesLevel;
    });
  }, [departmentFilter, entries, levelFilter, searchQuery]);

  const sections = useMemo<CourseSection[]>(() => {
    if (groupBy === "level") {
      return (Object.keys(levelNames) as Level[]).map((level) => ({
        title: levelNames[level],
        rows: filteredCourses
          .filter((course) => course.level === level)
          .map((course) => ({ course, listings: leadWith(course.listings, departmentFilter) }))
          .sort(compareRows),
      })).filter((section) => section.rows.length > 0);
    }

    // Cross-listed courses appear under each of their departments.
    return departments
      .filter((department) => departmentFilter === "all" || department === departmentFilter)
      .map((department) => ({
        title: departmentNames[department] ?? department,
        rows: filteredCourses
          .filter((course) => course.listings.some((listing) => listing.department === department))
          .map((course) => ({ course, listings: leadWith(course.listings, department) }))
          .sort(compareRows),
      })).filter((section) => section.rows.length > 0);
  }, [departmentFilter, departments, filteredCourses, groupBy]);

  return (
    <div className="mt-14">
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="course-search" className="text-sm font-semibold text-slate-600">
              Search courses
            </label>
            <input
              id="course-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Title, number, or topic"
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-[#002e5d] outline-none transition placeholder:text-slate-400 focus:border-[#0047ba] focus:ring-2 focus:ring-[#7fbeeb]/50 sm:w-64"
            />
          </div>
          <p className="text-sm font-semibold text-slate-500" aria-live="polite">
            {filteredCourses.length} of {courses.length} robotics-related courses
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex min-w-0 items-center gap-2">
              <label htmlFor="department-filter" className="text-sm font-semibold text-slate-600">
                Department
              </label>
              <select
                id="department-filter"
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="min-w-0 border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#002e5d] outline-none transition focus:border-[#0047ba] focus:ring-2 focus:ring-[#7fbeeb]/50"
              >
                <option value="all">All departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>{departmentNames[department] ?? department}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="level-filter" className="text-sm font-semibold text-slate-600">
                Level
              </label>
              <select
                id="level-filter"
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.target.value as LevelFilter)}
                className="border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#002e5d] outline-none transition focus:border-[#0047ba] focus:ring-2 focus:ring-[#7fbeeb]/50"
              >
                <option value="all">All levels</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span id="course-group-label" className="text-sm font-semibold text-slate-600">
              Group by
            </span>
            <div role="group" aria-labelledby="course-group-label" className="inline-flex border border-slate-300 bg-white">
              {groupOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={groupBy === option.value}
                  onClick={() => setGroupBy(option.value)}
                  className={`px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#7fbeeb]/50 ${
                    groupBy === option.value ? "bg-[#002e5d] text-white" : "text-[#002e5d] hover:bg-[#e8f3fb]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="border border-slate-200 bg-white px-5 py-8 text-center text-slate-600 shadow-sm">
          No courses match those search and filter settings.
        </p>
      ) : (
        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h3 className="eyebrow mb-3">
                {section.title}
                <span className="ml-3 font-semibold normal-case tracking-normal text-slate-500">
                  {section.rows.length} {section.rows.length === 1 ? "course" : "courses"}
                </span>
              </h3>

              <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
                {section.rows.map(({ course, listings }) => (
                  <details key={course.courseNumber} className="group border-b border-slate-100 last:border-b-0">
                    <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-3 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7fbeeb] sm:px-5 [&::-webkit-details-marker]:hidden">
                      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                        <span className="font-mono text-sm font-bold text-[#0047ba] sm:w-44 sm:shrink-0">
                          {listings.map((listing) => listing.code.replace(" ", " ")).join(" / ")}
                        </span>
                        <h4 className="font-bold text-[#002e5d]">{course.title}</h4>
                        {course.whenOffered && (
                          <span className="text-xs font-semibold text-slate-500 sm:ml-auto sm:shrink-0">{course.whenOffered}</span>
                        )}
                      </div>
                      <FiChevronDown aria-hidden="true" className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="px-4 pb-4 text-sm leading-6 text-slate-600 sm:pl-[13.25rem] sm:pr-12">
                      {course.summary}{" "}
                      <a
                        href={course.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#0047ba] hover:underline"
                      >
                        BYU catalog
                        <FiExternalLink aria-hidden="true" />
                      </a>
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
