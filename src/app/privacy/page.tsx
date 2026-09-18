import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy — Socialshit",
  description:
    "How Socialshit collects, uses, and shares information when you sign in with Facebook or Instagram and publish marketing content.",
};

const EFFECTIVE = "18 September 2026";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm leading-6 text-slate-300">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  const contactEmail = process.env.PRIVACY_CONTACT_EMAIL?.trim() || null;
  const githubUrl =
    process.env.PRIVACY_CONTACT_URL?.trim() ||
    "https://github.com/dewaprabawa/socialshit/issues";

  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-3">
        <Link href="/login" className="inline-flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-pink-500 font-black text-white">
            S
          </span>
          <span className="text-lg font-bold tracking-tight">Socialshit</span>
        </Link>
        <p className="text-xs uppercase tracking-wide text-slate-500">Legal</p>
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-slate-400">
          Effective date: {EFFECTIVE}. This policy describes how the Socialshit
          marketing app (“Socialshit”, “we”, “us”) handles information when you
          visit the site, sign in with Facebook or Instagram, connect business
          accounts, generate content, or publish and schedule posts.
        </p>
        <p className="text-sm text-slate-400">
          Meta (Facebook and Instagram) requires a public privacy policy URL
          before an app can go live. Paste this page’s URL into{" "}
          <span className="text-slate-200">App settings → Basic → Privacy Policy
          URL</span>.
        </p>
      </header>

      <nav className="card text-sm">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          On this page
        </p>
        <ul className="grid gap-1 text-brand-400 sm:grid-cols-2">
          <li>
            <a href="#who-we-are" className="hover:underline">
              Who we are
            </a>
          </li>
          <li>
            <a href="#information-we-collect" className="hover:underline">
              Information we collect
            </a>
          </li>
          <li>
            <a href="#how-we-use" className="hover:underline">
              How we use information
            </a>
          </li>
          <li>
            <a href="#sharing" className="hover:underline">
              Sharing and processors
            </a>
          </li>
          <li>
            <a href="#meta-platform" className="hover:underline">
              Facebook and Instagram
            </a>
          </li>
          <li>
            <a href="#cookies" className="hover:underline">
              Cookies and sessions
            </a>
          </li>
          <li>
            <a href="#retention" className="hover:underline">
              Retention and security
            </a>
          </li>
          <li>
            <a href="#data-deletion" className="hover:underline">
              Your rights and deletion
            </a>
          </li>
          <li>
            <a href="#children" className="hover:underline">
              Children
            </a>
          </li>
          <li>
            <a href="#contact" className="hover:underline">
              Contact
            </a>
          </li>
        </ul>
      </nav>

      <Section id="who-we-are" title="1. Who we are">
        <p>
          Socialshit is a web app that helps you generate marketing content,
          connect Facebook Pages and Instagram Business accounts, and publish or
          schedule posts. The service is operated by the person or organization
          that deployed this instance (the GitHub project is{" "}
          <a
            className="text-brand-400 hover:underline"
            href="https://github.com/dewaprabawa/socialshit"
            target="_blank"
            rel="noreferrer"
          >
            dewaprabawa/socialshit
          </a>
          ).
        </p>
        <p>
          This policy applies to this hosted Socialshit instance, including
          local development (for example <code>http://localhost:3000</code>) and
          production hosts such as{" "}
          <code>https://socialshit-dev-1.vercel.app</code>.
        </p>
      </Section>

      <Section id="information-we-collect" title="2. Information we collect">
        <p>Depending on how you use the app, we may store:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="text-white">Account profile.</span> When you
            continue with Facebook Login we receive the Facebook user id, name,
            and profile photo from <code>public_profile</code>. Email is stored
            only if Facebook grants it. Instagram Login stores the Instagram
            professional account id, name, and username.
          </li>
          <li>
            <span className="text-white">Connected Pages and Instagram accounts.</span>{" "}
            After you are signed in, Connect with Meta can store Facebook Page
            and Instagram Business ids, names, handles, avatars, and Page or
            user access tokens needed to publish.
          </li>
          <li>
            <span className="text-white">Content you create.</span> Captions,
            hashtags, image URLs or uploaded image files, schedule times,
            publish status, and (after a successful publish) Meta post ids and
            permalinks.
          </li>
          <li>
            <span className="text-white">Uploads.</span> Image files you upload
            (PNG, JPG, WEBP, GIF, up to 8 MB) are stored on the server disk
            locally, or in Vercel Blob when that store is configured.
          </li>
          <li>
            <span className="text-white">AI prompts.</span> If an OpenAI API key
            is configured, topic, brand, audience, tone, and related prompt
            text are sent to OpenAI to generate ideas, captions, or images. If
            no key is set, generation stays on this server with a template
            engine and is not sent to OpenAI.
          </li>
          <li>
            <span className="text-white">Canva.</span> If you connect Canva we
            store OAuth tokens so we can create or export designs on your
            behalf.
          </li>
          <li>
            <span className="text-white">Sandbox / demo mode.</span> If Meta
            keys are not configured, Continue with Facebook or Instagram creates
            a demo user and fake accounts. Those records are local to this app
            and are not sent to Meta.
          </li>
        </ul>
        <p>
          We do not ask for your Facebook or Instagram password. Login happens
          on Meta’s sites. We do not scrape your friends list, personal
          Messenger history, or Instagram DMs.
        </p>
      </Section>

      <Section id="how-we-use" title="3. How we use information">
        <p>We use this information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Sign you in and keep you signed in.</li>
          <li>Show your name and avatar in the app.</li>
          <li>
            Attach Facebook Pages and Instagram Business accounts you choose
            and publish or schedule posts you create.
          </li>
          <li>Generate captions, ideas, and images when you ask.</li>
          <li>Create or import Canva designs when you ask.</li>
          <li>Operate, debug, and secure the service.</li>
        </ul>
        <p>
          We do not sell your personal information. We do not use Facebook or
          Instagram data to build independent ad profiles or to contact your
          audience except by publishing the posts you explicitly create.
        </p>
      </Section>

      <Section id="sharing" title="4. Sharing and processors">
        <p>
          We share information only as needed to run the features you use:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="text-white">Meta Platforms, Inc.</span> (Facebook
            and Instagram) — login, Page/IG connection, and publishing via the
            Graph API. Meta’s own policies apply to data they hold. See{" "}
            <a
              className="text-brand-400 hover:underline"
              href="https://www.facebook.com/privacy/policy/"
              target="_blank"
              rel="noreferrer"
            >
              Meta Privacy Policy
            </a>
            .
          </li>
          <li>
            <span className="text-white">OpenAI</span> — only if this instance
            has an OpenAI API key and you generate AI content. See{" "}
            <a
              className="text-brand-400 hover:underline"
              href="https://openai.com/policies/privacy-policy"
              target="_blank"
              rel="noreferrer"
            >
              OpenAI Privacy Policy
            </a>
            .
          </li>
          <li>
            <span className="text-white">Canva</span> — only if you connect
            Canva. See{" "}
            <a
              className="text-brand-400 hover:underline"
              href="https://www.canva.com/policies/privacy-policy/"
              target="_blank"
              rel="noreferrer"
            >
              Canva Privacy Policy
            </a>
            .
          </li>
          <li>
            <span className="text-white">Hosting and database.</span> This app
            may run on Vercel or similar hosts, with PostgreSQL (or a local
            database in development) and optional Vercel Blob for images.
            Those providers process data under their terms to keep the service
            online.
          </li>
        </ul>
        <p>
          We may disclose information if required by law, to protect the
          service, or with your direction (for example when you publish a post
          to Facebook or Instagram, that content becomes visible according to
          the Page or account’s audience settings).
        </p>
      </Section>

      <Section id="meta-platform" title="5. Facebook and Instagram platform">
        <p>
          Socialshit is an independent app that uses Facebook Login, Instagram
          API with Instagram Login, and the Graph API. Instagram publishing
          through Instagram Login does not require a Facebook Page or a Meta
          Business portfolio. Socialshit is not affiliated with Meta beyond those
          APIs.
        </p>
        <p>Permissions this instance may request:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Login: <code>public_profile</code> (and <code>email</code> if the
            Meta app enables it); Instagram professional login scopes such as{" "}
            <code>instagram_business_basic</code> and{" "}
            <code>instagram_business_content_publish</code>.
          </li>
          <li>
            Publishing: <code>pages_show_list</code>,{" "}
            <code>pages_read_engagement</code>, <code>pages_manage_posts</code>,{" "}
            <code>instagram_basic</code>, <code>instagram_content_publish</code>,{" "}
            <code>business_management</code>.
          </li>
        </ul>
        <p>
          You can remove Socialshit from your Facebook account at any time
          under Facebook Settings → Apps and websites. That stops future
          Graph API access from this app; it does not automatically delete
          posts already published on your Page or Instagram account.
        </p>
      </Section>

      <Section id="cookies" title="6. Cookies and sessions">
        <p>We use first-party cookies that are required to sign you in:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <code>socialshit_session</code> — httpOnly session cookie (about 30
            days) that identifies your signed-in user. We store a hash of the
            token, not the raw token, in the database.
          </li>
          <li>
            <code>socialshit_oauth_state</code> — short-lived httpOnly cookie
            (about 10 minutes) used to protect Facebook/Instagram login against
            CSRF. Login state is also HMAC-signed.
          </li>
        </ul>
        <p>
          We do not use third-party advertising cookies or sell cookie data.
        </p>
      </Section>

      <Section id="retention" title="7. Retention and security">
        <p>
          Profile, connected accounts, posts, and tokens are kept until you
          delete them or ask us to delete your account, or until the operator
          removes the database. Session records expire after about 30 days.
          OAuth state cookies expire in minutes.
        </p>
        <p>
          Access tokens are stored so the app can publish on your behalf. Keep
          this instance’s environment variables and database private. Use HTTPS
          in production. No method of transmission or storage is completely
          secure.
        </p>
      </Section>

      <Section id="data-deletion" title="8. Your rights and how to delete data">
        <p>
          You can ask for access to, correction of, or deletion of personal
          data this instance stores about you, subject to applicable law
          (including GDPR-style rights where they apply).
        </p>
        <p className="font-medium text-slate-100">To delete your Socialshit data:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            In this app, log out (clears the session cookie and the hashed
            session on the server).
          </li>
          <li>
            Disconnect Facebook Pages / Instagram accounts from the Accounts
            page if they are still listed.
          </li>
          <li>
            On Facebook, open Settings → Apps and websites, find Socialshit (or
            the Meta app name shown during login), and remove it.
          </li>
          <li>
            Email or open an issue using the contact details below and ask us
            to delete your user record. We will delete the matching user,
            sessions, connected account tokens, and posts stored in this app’s
            database. Uploaded files that are not referenced will be removed
            where we still control the storage.
          </li>
        </ol>
        <p>
          Published posts that already went live on Facebook or Instagram stay
          on those platforms until you delete them there. Sandbox / demo users
          never received real Meta tokens.
        </p>
        <p>
          Meta App Review: you may also paste this section’s URL as the{" "}
          <span className="text-slate-200">User data deletion</span>{" "}
          instructions URL:{" "}
          <code className="break-all text-slate-200">/privacy#data-deletion</code>
          .
        </p>
      </Section>

      <Section id="children" title="9. Children">
        <p>
          Socialshit is not directed at children under 13, and you must meet
          Facebook’s and Instagram’s minimum age to use those logins. We do
          not knowingly collect personal information from children under 13. If
          you believe we have, contact us and we will delete it.
        </p>
      </Section>

      <Section id="international" title="10. International processing">
        <p>
          Hosting, Meta, OpenAI, and Canva may process data in the United
          States or other countries. If you use this app from elsewhere, you
          understand that information may be transferred to those locations.
        </p>
      </Section>

      <Section id="changes" title="11. Changes">
        <p>
          We may update this policy when the product or the law changes. The
          effective date at the top will change. Continued use after an update
          means you accept the revised policy.
        </p>
      </Section>

      <Section id="contact" title="12. Contact">
        <p>
          Privacy questions and deletion requests for this instance:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          {contactEmail ? (
            <li>
              Email{" "}
              <a
                className="text-brand-400 hover:underline"
                href={`mailto:${contactEmail}`}
              >
                {contactEmail}
              </a>
            </li>
          ) : null}
          <li>
            GitHub issues:{" "}
            <a
              className="text-brand-400 hover:underline"
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
            >
              {githubUrl}
            </a>
          </li>
        </ul>
        <p>
          Set <code>PRIVACY_CONTACT_EMAIL</code> on the server if you want a
          public email on this page.
        </p>
      </Section>

      <p className="text-sm text-slate-500">
        <Link href="/login" className="text-brand-400 hover:underline">
          Back to sign in
        </Link>
        {" · "}
        <Link href="/" className="text-brand-400 hover:underline">
          Dashboard
        </Link>
      </p>
    </article>
  );
}
