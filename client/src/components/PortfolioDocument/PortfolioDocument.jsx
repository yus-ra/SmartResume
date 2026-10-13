import { ExternalLink, Globe, Mail } from "lucide-react";

import { cleanUrl, getInitials, resolveTheme } from "../../lib/portfolio";

/*
 * The rendered portfolio itself.
 *
 * This markup used to live inline inside the builder's preview pane. It is
 * extracted here because the SAME document is now rendered in two places:
 *
 *   pages/Portfolio/Portfolio.jsx          the builder's live preview
 *   pages/PublicPortfolio/PublicPortfolio  the published page at /p/:slug
 *
 * Two copies of a 400-line document is the reliable way to guarantee the
 * preview and the published page disagree, so there is exactly one.
 *
 * It is a pure function of its props: no fetching, no storage, no auth. The
 * caller decides where the data came from — local state in the builder, or the
 * public API on the published page.
 *
 * Props:
 *   portfolio  canonical portfolio (see lib/portfolio.js)
 *   resume     { experience, education, skills } — resume sections joined to
 *              the portfolio. May be omitted; sections then render empty.
 */

/** One labelled section of the document. */
const DocumentSection = ({ title, theme, children }) => (
  <div className="px-6 sm:px-10 py-8">
    <h3
      className="text-sm font-bold uppercase tracking-wider mb-5"
      style={{ color: theme.accent }}
    >
      {title}
    </h3>

    {children}
  </div>
);

/** Shown in place of a section that has no content yet. */
const EmptySection = ({ text, theme }) => (
  <div
    className="rounded-xl border border-dashed p-4"
    style={{ borderColor: `${theme.accent}30` }}
  >
    <p className="text-sm" style={{ color: theme.muted }}>
      {text}
    </p>
  </div>
);

/** A contact / social pill in the hero. */
const SocialLink = ({ href, icon, label, theme }) => {
  const safeHref = cleanUrl(href);

  if (!safeHref) {
    return null;
  }

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border"
      style={{ borderColor: `${theme.accent}40`, color: theme.accent }}
    >
      {icon}
      {label}
    </a>
  );
};

const ExperienceSection = ({ experience, theme }) => (
  <DocumentSection title="Experience" theme={theme}>
    {experience.length > 0 ? (
      <div className="space-y-6">
        {experience.map((item, index) => (
          <div key={item.id || index} className="relative pl-5">
            <div
              className="absolute left-0 top-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: theme.accent }}
            />

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
              <div>
                <h4 className="font-semibold">{item.role || "Role"}</h4>

                <p className="text-sm mt-1" style={{ color: theme.accent }}>
                  {item.company || "Company"}
                </p>
              </div>

              {item.period && (
                <span className="text-xs" style={{ color: theme.muted }}>
                  {item.period}
                </span>
              )}
            </div>

            {Array.isArray(item.bullets) && item.bullets.length > 0 && (
              <ul
                className="mt-3 space-y-2 text-sm leading-5"
                style={{ color: theme.muted }}
              >
                {item.bullets.map((bullet, bulletIndex) => (
                  <li key={bulletIndex} className="flex gap-2">
                    <span>•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    ) : (
      <EmptySection
        text="Add experience to your resume and it will appear here."
        theme={theme}
      />
    )}
  </DocumentSection>
);

const ProjectsSection = ({ projects, theme }) => {
  // A project with neither title nor description is still being typed, so it
  // is not published as an empty card.
  const visibleProjects = projects.filter(
    (project) => project.title || project.desc,
  );

  return (
    <DocumentSection title="Featured Projects" theme={theme}>
      {visibleProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {visibleProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border p-4"
              style={{ borderColor: `${theme.accent}25` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold">
                    {project.title || "Untitled Project"}
                  </h4>

                  {project.desc && (
                    <p
                      className="text-sm leading-5 mt-2"
                      style={{ color: theme.muted }}
                    >
                      {project.desc}
                    </p>
                  )}
                </div>

                {cleanUrl(project.link) && (
                  <a
                    href={cleanUrl(project.link)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex-shrink-0"
                    style={{ color: theme.accent }}
                    aria-label={`Open ${project.title || "project"} link`}
                  >
                    <ExternalLink size={17} />
                  </a>
                )}
              </div>

              {project.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {project.tags.map((tag, tagIndex) => (
                    <span
                      key={`${project.id}-${tagIndex}`}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                      style={{
                        backgroundColor: `${theme.accent}12`,
                        color: theme.accent,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptySection
          text="Add your projects to showcase your work."
          theme={theme}
        />
      )}
    </DocumentSection>
  );
};

const SkillsSection = ({ skills, theme }) => (
  <DocumentSection title="Skills" theme={theme}>
    {skills.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={`${skill}-${index}`}
            className="px-3 py-2 rounded-lg text-xs font-medium border"
            style={{ borderColor: `${theme.accent}25`, color: theme.text }}
          >
            {skill}
          </span>
        ))}
      </div>
    ) : (
      <EmptySection text="Your resume skills will appear here." theme={theme} />
    )}
  </DocumentSection>
);

const EducationSection = ({ education, theme }) => {
  // Education is omitted entirely when empty, rather than showing a placeholder.
  if (education.length === 0) {
    return null;
  }

  return (
    <DocumentSection title="Education" theme={theme}>
      <div className="space-y-4">
        {education.map((item, index) => (
          <div
            key={item.id || index}
            className="flex flex-col sm:flex-row sm:justify-between gap-1"
          >
            <div>
              <h4 className="font-semibold">{item.degree || "Degree"}</h4>

              <p className="text-sm mt-1" style={{ color: theme.muted }}>
                {item.school || "Institution"}
              </p>
            </div>

            {item.period && (
              <span className="text-xs" style={{ color: theme.muted }}>
                {item.period}
              </span>
            )}
          </div>
        ))}
      </div>
    </DocumentSection>
  );
};

const PortfolioDocument = ({ portfolio, resume, className = "" }) => {
  const theme = resolveTheme(portfolio.themeId);

  const experience = resume?.experience ?? [];
  const education = resume?.education ?? [];
  const skills = resume?.skills ?? [];

  const { profile } = portfolio;

  return (
    <div
      className={className}
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* HERO */}

      <div className="px-6 sm:px-10 pt-10 pb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white mb-5"
          style={{ backgroundColor: theme.accent }}
        >
          {getInitials(profile.name)}
        </div>

        <h2 className="text-3xl font-bold tracking-tight">
          {profile.name || "Your Name"}
        </h2>

        <p className="text-lg font-medium mt-2" style={{ color: theme.accent }}>
          {profile.title || "Your Professional Title"}
        </p>

        <p
          className="text-sm leading-6 mt-4 max-w-2xl"
          style={{ color: theme.muted }}
        >
          {profile.bio ||
            "Your professional summary will appear here. Add a short introduction about yourself, your skills, and what you do."}
        </p>

        <div className="flex flex-wrap gap-2 mt-6">
          <SocialLink
            href={profile.email}
            icon={<Mail size={14} />}
            label="Email"
            theme={theme}
          />

          <SocialLink
            href={profile.linkedin}
            icon={<Globe size={14} />}
            label="LinkedIn"
            theme={theme}
          />

          <SocialLink
            href={profile.github}
            icon={<Globe size={14} />}
            label="GitHub"
            theme={theme}
          />
        </div>
      </div>

      {/* DIVIDER */}

      <div
        className="mx-6 sm:mx-10 border-t"
        style={{ borderColor: `${theme.accent}20` }}
      />

      <ExperienceSection experience={experience} theme={theme} />

      <ProjectsSection projects={portfolio.projects} theme={theme} />

      <SkillsSection skills={skills} theme={theme} />

      <EducationSection education={education} theme={theme} />

      {/* FOOTER */}

      <div
        className="px-6 sm:px-10 py-6 border-t"
        style={{ borderColor: `${theme.accent}20` }}
      >
        <p className="text-xs" style={{ color: theme.muted }}>
          Built with SmartResume
        </p>
      </div>
    </div>
  );
};

export default PortfolioDocument;
