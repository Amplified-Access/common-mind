import { pageTypes } from "../pageCopy";

import { application } from "./application";
import { dataset } from "./dataset";
import { footer } from "./footer";
import { language } from "./language";
import { legalPage } from "./legalPage";
import { model } from "./model";
import { link } from "./parts";
import { publication } from "./publication";
import { release } from "./release";
import { siteSettings } from "./siteSettings";

export const schemaTypes = [
  publication,
  release,
  model,
  language,
  dataset,
  application,
  siteSettings,
  footer,
  legalPage,
  ...pageTypes,
  link,
];
