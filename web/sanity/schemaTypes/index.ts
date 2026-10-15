import { application } from "./application";
import { dataset } from "./dataset";
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
  dataset,
  application,
  siteSettings,
  legalPage,
  link,
];
