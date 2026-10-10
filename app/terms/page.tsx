import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalDocument,
  LegalList,
  LegalSection,
  LegalSubheading,
} from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms that govern use of CommonMind's website, models, datasets, benchmarks, APIs, and tools.",
};

// Details still to be confirmed: shown in yellow until they are.
function Pending({ children }: { children: React.ReactNode }) {
  return <span className="text-signal">{children}</span>;
}

function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-foreground underline underline-offset-4 hover:text-signal">
      {children}
    </Link>
  );
}

const TermsPage = () => {
  return (
    <LegalDocument
      title="Terms of Use"
      updated="October 2026"
      closing={
        <>
          <p>Open infrastructure works best when it is used with care.</p>
          <p>
            These terms exist so that CommonMind can stay open, useful, and safe for the
            communities whose languages and voices it is built around.
          </p>
        </>
      }
    >
      <LegalSection number={1} title="Acceptance of These Terms">
        <p>
          These Terms of Use govern your access to and use of the CommonMind website, models,
          datasets, benchmarks, playgrounds, APIs, documentation, and related tools
          (together, &quot;CommonMind&quot;). CommonMind is an initiative of Amplified Access.
        </p>
        <p>
          By accessing or using CommonMind, you agree to these terms. If you use CommonMind on
          behalf of an organisation, you confirm that you are authorised to accept these terms
          on its behalf, and &quot;you&quot; includes that organisation.
        </p>
        <p>If you do not agree to these terms, please do not use CommonMind.</p>
      </LegalSection>

      <LegalSection number={2} title="Eligibility">
        <p>
          You must be at least 18 years old, or the age of majority where you live, to use
          CommonMind. Younger users may take part only through a programme or research activity
          that explicitly allows it, with appropriate consent and safeguards in place.
        </p>
      </LegalSection>

      <LegalSection number={3} title="Using CommonMind">
        <p>
          CommonMind provides open research resources and developer tools for multilingual civic
          AI. Some resources are hosted by CommonMind; others are published on third-party
          platforms such as Hugging Face, Kaggle, and Ollama.
        </p>
        <LegalSubheading>Accounts and API keys</LegalSubheading>
        <p>
          Some services may require an account or an API key. You are responsible for keeping
          your credentials confidential, for all activity that takes place under them, and for
          telling us promptly if you believe they have been compromised.
        </p>
        <LegalSubheading>Usage limits</LegalSubheading>
        <p>
          Hosted services, including the playground and API, may be subject to rate limits,
          input limits, and fair-use restrictions. These help keep the services available to
          everyone and may change over time.
        </p>
      </LegalSection>

      <LegalSection number={4} title="Models, Datasets, and Benchmarks">
        <p>
          Each model, adapter, and dataset is released under its own license, which governs
          how it may be used, modified, and redistributed. Adapters also inherit the terms of the
          base model they load. Where a license and these terms differ, the license governs your
          use of that resource.
        </p>
        <p>
          Datasets maintained by third parties remain subject to their publishers&apos; terms.
          Please check each publisher&apos;s page before reuse. A summary is available on the{" "}
          <InlineLink href="/licenses">Licenses</InlineLink> page.
        </p>
        <p>
          Benchmark results are published to support transparent, reproducible comparison.
          When you cite or republish them, please reference the evaluation set and methodology
          used.
        </p>
      </LegalSection>

      <LegalSection number={5} title="AI Outputs">
        <p>
          CommonMind models generate outputs automatically. Translations, transcriptions,
          classifications, and summaries may be incomplete, inaccurate, or miss the cultural and
          institutional context of what was said.
        </p>
        <p>You are responsible for how you use outputs. In particular, you should:</p>
        <LegalList
          items={[
            "review outputs before relying on them or sharing them;",
            "involve qualified people, including speakers of the language, where accuracy matters;",
            "make clear to others when content has been generated or translated by AI; and",
            "keep human review in place for any decision that affects people's rights, safety, or access to services.",
          ]}
        />
        <p>
          Outputs are provided for information and research purposes. They are not legal,
          medical, financial, or other professional advice.
        </p>
      </LegalSection>

      <LegalSection number={6} title="Your Inputs">
        <p>
          You keep any rights you have in the text, audio, or other content you submit to
          CommonMind (&quot;inputs&quot;). You grant us permission to process your inputs as
          needed to provide, secure, evaluate, and improve CommonMind, as described in the{" "}
          <InlineLink href="/privacy">Privacy Policy</InlineLink>.
        </p>
        <p>
          You confirm that you have the right to submit your inputs. Please avoid submitting
          personal or sensitive information about yourself or others unless it is necessary and
          you have a lawful basis to share it.
        </p>
      </LegalSection>

      <LegalSection number={7} title="Contributions">
        <p>
          You may contribute language data, terminology, recordings, evaluations, corrections,
          or other material to CommonMind research and community initiatives
          (&quot;contributions&quot;).
        </p>
        <p>When you make a contribution, you confirm that:</p>
        <LegalList
          items={[
            "you created it or have the right to share it;",
            "anyone identifiable in it has given informed consent to its collection and use; and",
            "it does not infringe anyone else's rights.",
          ]}
        />
        <p>
          Unless a specific programme states other terms, you grant Amplified Access a
          worldwide, royalty-free, non-exclusive license to use, adapt, and publish your
          contribution for CommonMind research and development, including in openly licensed
          datasets and models. Contributions collected through community programmes follow the
          consent terms presented at the time of collection.
        </p>
        <p>
          Feedback and suggestions about CommonMind may be used to improve it without any
          obligation to you.
        </p>
      </LegalSection>

      <LegalSection number={8} title="Acceptable Use">
        <p>
          CommonMind is built to help people understand and act on civic discourse. You agree
          to use it lawfully and in a way that respects the communities it serves. You may not
          use CommonMind to:
        </p>
        <LegalList
          items={[
            "surveil, profile, or track individuals or communities, including on the basis of their language, ethnicity, political views, or civic participation;",
            "identify or re-identify anonymous contributors, reporters, or people described in data;",
            "intimidate, harass, or retaliate against people who report concerns or take part in public life;",
            "interfere with elections or democratic processes, including through voter suppression or deceptive political content;",
            "generate or spread disinformation, or impersonate public institutions, officials, or other people;",
            "make automated decisions about people's rights, benefits, or access to services without meaningful human review;",
            "violate the license of any model or dataset, or the rights of others;",
            "probe, disrupt, overload, or bypass the security or usage limits of CommonMind services; or",
            "collect data from CommonMind services through automated means beyond what the published APIs and repositories allow.",
          ]}
        />
      </LegalSection>

      <LegalSection number={9} title="Intellectual Property">
        <p>
          Apart from openly licensed models, datasets, and code, the CommonMind name, logo, and
          website content belong to Amplified Access or its licensors. You may refer to
          CommonMind by name to describe your use of it, but you may not use its name or branding
          in a way that suggests endorsement or partnership without our written permission.
        </p>
      </LegalSection>

      <LegalSection number={10} title="Third-Party Services">
        <p>
          CommonMind links to and relies on services operated by others, including model and
          dataset repositories. Those services are governed by their own terms and policies, and
          we are not responsible for their content, availability, or practices.
        </p>
      </LegalSection>

      <LegalSection number={11} title="Availability and Changes to the Service">
        <p>
          CommonMind is an evolving research platform. We may add, change, suspend, or retire
          models, datasets, features, or services at any time. Where reasonable, we will give
          notice of significant changes to hosted services.
        </p>
        <p>
          We may suspend or end your access to hosted services if you breach these terms, if your
          use creates risk for others, or where required by law.
        </p>
      </LegalSection>

      <LegalSection number={12} title="Disclaimers">
        <p>
          To the fullest extent permitted by law, CommonMind is provided &quot;as is&quot; and
          &quot;as available&quot;, without warranties of any kind, whether express or implied,
          including warranties of accuracy, fitness for a particular purpose, non-infringement,
          and uninterrupted or error-free operation.
        </p>
      </LegalSection>

      <LegalSection number={13} title="Limitation of Liability">
        <p>
          To the fullest extent permitted by law, Amplified Access and its partners, staff, and
          contributors will not be liable for any indirect, incidental, special, consequential,
          or punitive damages, or for any loss of data, revenue, or goodwill, arising from your
          use of CommonMind or its outputs.
        </p>
        <p>
          Nothing in these terms limits liability that cannot be limited under applicable law.
        </p>
      </LegalSection>

      <LegalSection number={14} title="Indemnity">
        <p>
          You agree to indemnify Amplified Access against claims, losses, and costs arising from
          your breach of these terms or your misuse of CommonMind, to the extent permitted by
          law.
        </p>
      </LegalSection>

      <LegalSection number={15} title="Governing Law">
        <p>
          These terms are governed by the laws of <Pending>[Insert governing jurisdiction]</Pending>.
          Any dispute will be resolved by the courts of that jurisdiction, unless applicable law
          gives you the right to bring proceedings elsewhere.
        </p>
      </LegalSection>

      <LegalSection number={16} title="Changes to These Terms">
        <p>
          We may update these terms as CommonMind, its research, and its services evolve. When
          material changes are made, the updated terms will be published on this page and the
          &quot;Last updated&quot; date will be revised. Continuing to use CommonMind after an
          update means you accept the updated terms.
        </p>
      </LegalSection>

      <LegalSection number={17} title="Contact">
        <p>Questions about these terms can be directed to:</p>
        <p className="text-foreground">CommonMind</p>
        <p>
          Contact: <Pending><span className="font-mono">[Insert contact email]</span></Pending>
          <br />
          Organisation / legal entity: <Pending>[Insert registered entity]</Pending>
          <br />
          Address: <Pending>[Insert official address]</Pending>
        </p>
      </LegalSection>
    </LegalDocument>
  );
};

export default TermsPage;
