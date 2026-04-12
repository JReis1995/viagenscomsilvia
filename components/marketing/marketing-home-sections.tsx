"use client";

import type { ComponentProps } from "react";
import { Suspense, useCallback, useEffect, useState } from "react";

import { ClientAccountHomeSection } from "@/components/marketing/client-account-home-section";
import { ConsultoraSection } from "@/components/marketing/consultora-section";
import { ExperienceFeed } from "@/components/marketing/experience-feed";
import { HowWeWorkSection } from "@/components/marketing/how-we-work-section";
import { InstagramSocialSection } from "@/components/marketing/instagram-social-section";
import { LuxuryHero } from "@/components/marketing/luxury-hero";
import { QuizSection } from "@/components/marketing/quiz-section";
import { TravelStoriesSection } from "@/components/marketing/travel-stories-section";
import type { PedidoOrcamentoPrefill } from "@/lib/marketing/pedido-orcamento";
import {
  HOME_SECTION_LABEL,
  type HomeSectionId,
  parseHomeSectionOrder,
  serializeHomeSectionOrder,
} from "@/lib/site/home-section-order";
import type { SiteContent } from "@/lib/site/site-content";
import type { PublishedPost } from "@/types/post";

export type MarketingHomeCrmSlots = {
  hero?: ComponentProps<typeof LuxuryHero>["crm"];
  feed?: ComponentProps<typeof ExperienceFeed>["crm"];
  social?: ComponentProps<typeof InstagramSocialSection>["crm"];
  consultora?: ComponentProps<typeof ConsultoraSection>["crm"];
  quiz?: ComponentProps<typeof QuizSection>["crm"];
  stories?: ComponentProps<typeof TravelStoriesSection>["crm"];
  process?: ComponentProps<typeof HowWeWorkSection>["crm"];
  account?: ComponentProps<typeof ClientAccountHomeSection>["crm"];
};

export type MarketingHomeSectionsProps = {
  site: SiteContent;
  posts: PublishedPost[];
  prefill: PedidoOrcamentoPrefill | null;
  quizKey: string;
  viewerUserId: string | null;
  wishlistedPostIds: string[];
  /** Quando definido, mostra barras para arrastar blocos e chama com o novo CSV. */
  onLayoutOrderChange?: (homeOrderCsv: string) => void;
  crm?: MarketingHomeCrmSlots;
};

function moveBefore(
  order: HomeSectionId[],
  dragged: HomeSectionId,
  target: HomeSectionId,
): HomeSectionId[] {
  if (dragged === target) return order;
  const rest = order.filter((x) => x !== dragged);
  const ti = rest.indexOf(target);
  if (ti === -1) return order;
  rest.splice(ti, 0, dragged);
  return rest;
}

export function MarketingHomeSections({
  site,
  posts,
  prefill,
  quizKey,
  viewerUserId,
  wishlistedPostIds,
  onLayoutOrderChange,
  crm,
}: MarketingHomeSectionsProps) {
  const csv = site.layout.homeOrderCsv;
  const [order, setOrder] = useState(() => parseHomeSectionOrder(csv));

  useEffect(() => {
    setOrder(parseHomeSectionOrder(csv));
  }, [csv]);

  const applyOrder = useCallback(
    (next: HomeSectionId[]) => {
      setOrder(next);
      onLayoutOrderChange?.(serializeHomeSectionOrder(next));
    },
    [onLayoutOrderChange],
  );

  const onDropOn = useCallback(
    (targetId: HomeSectionId, dragged: HomeSectionId) => {
      applyOrder(moveBefore(order, dragged, targetId));
    },
    [order, applyOrder],
  );

  const layoutEdit = Boolean(onLayoutOrderChange);

  const renderSection = (id: HomeSectionId) => {
    switch (id) {
      case "hero":
        return (
          <Suspense
            fallback={
              <div
                className="min-h-[min(92svh,900px)] bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-950"
                aria-hidden
              />
            }
          >
            <LuxuryHero
              copy={site.hero}
              quizCopy={site.quiz}
              crm={crm?.hero}
            />
          </Suspense>
        );
      case "feed":
        return (
          <ExperienceFeed
            posts={posts}
            feed={site.feed}
            featuredVideo={site.featuredVideo}
            viewerUserId={viewerUserId}
            wishlistedPostIds={wishlistedPostIds}
            crm={crm?.feed}
          />
        );
      case "stories":
        return (
          <TravelStoriesSection
            copy={site.travelStories}
            showPlaceholder={layoutEdit && !crm?.stories}
            crm={crm?.stories}
          />
        );
      case "social":
        return (
          <InstagramSocialSection copy={site.socialFeed} crm={crm?.social} />
        );
      case "consultora":
        return (
          <ConsultoraSection
            copy={site.consultora}
            alma={site.almaTestimonials}
            crm={crm?.consultora}
          />
        );
      case "process":
        return (
          <HowWeWorkSection
            copy={site.howWeWork}
            showPlaceholder={layoutEdit && !crm?.process}
            crm={crm?.process}
          />
        );
      case "account":
        return (
          <ClientAccountHomeSection
            copy={site.registerIncentive}
            showPlaceholder={layoutEdit && !crm?.account}
            crm={crm?.account}
          />
        );
      case "quiz":
        return (
          <QuizSection
            copy={site.quiz}
            quizSuccess={site.quizSuccess}
            alma={site.almaTestimonials}
            prefill={prefill}
            quizKey={quizKey}
            crm={crm?.quiz}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {order.map((id) => {
        const inner = renderSection(id);
        if (!inner && !onLayoutOrderChange) {
          return null;
        }
        if (!onLayoutOrderChange) {
          return <div key={id}>{inner}</div>;
        }
        return (
          <section
            key={id}
            className="relative border-t border-amber-200/40 bg-amber-50/20"
            data-home-section={id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const raw = e.dataTransfer.getData("home-section");
              if (raw && raw !== id) {
                onDropOn(id, raw as HomeSectionId);
              }
            }}
          >
            <div className="sticky top-[3.25rem] z-[65] flex flex-wrap items-center justify-center gap-2 border-b border-amber-200/60 bg-amber-50/95 px-2 py-2 text-[11px] text-amber-950 shadow-sm backdrop-blur-sm sm:justify-between sm:px-4">
              <span
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("home-section", id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="inline-flex cursor-grab items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-2.5 py-1 font-semibold shadow-sm active:cursor-grabbing"
                title="Arrasta e larga sobre a barra de outro bloco para mudar a ordem"
              >
                <span aria-hidden>⋮⋮</span>
                {HOME_SECTION_LABEL[id]}
              </span>
              <span className="hidden text-amber-800/90 sm:inline">
                Larga sobre outro bloco para colocar antes dele
              </span>
            </div>
            <div className="pointer-events-auto">{inner}</div>
          </section>
        );
      })}
    </>
  );
}
