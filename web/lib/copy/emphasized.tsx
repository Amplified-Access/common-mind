import { Fragment } from "react";

import { splitEmphasis } from "./emphasis";

/** Copy with its *starred* words in the signal colour. */
function Emphasized({ text }: { text: string }) {
  return splitEmphasis(text).map((part, i) =>
    part.em ? (
      <span key={i} className="text-signal">
        {part.text}
      </span>
    ) : (
      <Fragment key={i}>{part.text}</Fragment>
    ),
  );
}

export { Emphasized };
