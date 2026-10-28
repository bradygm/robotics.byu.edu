import type { ReactNode } from "react";

export type Professor = {
  id: string;
  name: string;
  image?: string;
  affiliation?: string;
  bio?: string;
  interests?: string;
  link?: string;
};

export type Lab = {
  id: string;
  name: string;
  affiliation: string;
  image: string;
  bio: string;
  link: string;
};

export type FAQ = {
  question: string;
  answer: ReactNode;
};

export type Course = {
  // Cross-listings are separated by " / ". Department and level are derived from this.
  courseNumber: string;
  title: string;
  whenOffered?: string;
  relationshipToRobotics?: string;
  syllabusUrl?: string;
};
