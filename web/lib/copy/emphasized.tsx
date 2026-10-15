import { Fragment } from "react";

import { splitEmphasis } from "./emphasis";

/**
 * Copy with its *starred* words in the signal colour. A new line in the
 * text breaks the line there on wider screens; phones wrap it naturally.
 */
function Emphasized({ text }: { text: string }) {
  return text.split("\n").map((line, l) => (
    <Fragment key={l}>
      {l > 0 && <br className="max-sm:hidden" />}
      {splitEmphasis(line).map((part, i) =>
        part.em ? (
          <span key={i} className="text-signal">
            {part.text}
          </span>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </Fragment>
  ));
}

export { Emphasized };
