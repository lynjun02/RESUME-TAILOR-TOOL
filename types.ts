export enum AppState {
  UPLOAD = 'UPLOAD',
  JOB_DESCRIPTION = 'JOB_DESCRIPTION',
  GENERATING = 'GENERATING',
  REVIEW = 'REVIEW',
  FINAL = 'FINAL',
}

// Represents a source from Google Search grounding
export type GroundingSource = {
    web: {
        uri: string;
        title: string;
    }
};

// Represents a single resume draft, including its text and any web sources used to generate it
export type Draft = {
    text: string;
    sources?: GroundingSource[];
    changelog?: string;
};