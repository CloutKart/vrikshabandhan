/**
 * Programme numbers (trees planted, alive after three monsoons, schools,
 * villages, volunteers). Null until the Abhiyan has counted them; the
 * numbers block renders nothing while this is null.
 */
export type ProgrammeNumbers = {
  asOf: string;
  treesPlanted: number;
  treesAlive: number;
  schools: number;
  villages: number;
  volunteers: number;
};

export const programmeNumbers: ProgrammeNumbers | null = null;
