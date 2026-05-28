import { useEffect, useState } from "react";

export function usePageMeta({ title, description, lang = "en" }) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    document.documentElement.lang = lang;

    if (description) {
      const meta = document.querySelector('meta[name="description"]');

      if (meta) {
        meta.setAttribute("content", description);
      }
    }
  }, [title, description, lang]);
}

export function useRevealOnScroll() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    const observeAll = () => {
      document
        .querySelectorAll(".reveal:not(.active), .handwrite:not(.active)")
        .forEach((el) => {
          observer.observe(el);
        });
    };

    observeAll();

    const mutation = new MutationObserver(observeAll);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, []);
}

export function useActiveSection(pathname) {
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    if (pathname !== "/") {
      return undefined;
    }

    const sectionIds = ["home", "services", "work", "about", "words", "contact"];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (sections.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-150px 0px -75% 0px" }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [pathname]);

  return pathname === "/" ? activeSection : null;
}
