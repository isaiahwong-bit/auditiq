import { UserProfile, Organisation, Site } from '@auditarmour/types';

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
      accessToken?: string;
      org?: Organisation;
      site?: Site;
    }
  }
}
