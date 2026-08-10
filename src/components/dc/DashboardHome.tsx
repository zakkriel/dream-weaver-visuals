import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  Crown,
  Feather,
  Plus,
  Puzzle,
  Settings,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPanel } from "@/components/dc/DashboardPanel";
import { DashboardRail } from "@/components/dc/DashboardRail";
import type { DashboardMock, DashboardWorld } from "@/types/dashboard";
import cityImage from "@/assets/dashboard-city.jpg";
import worldsImage from "@/assets/dashboard-worlds.jpg";
import portraitsImage from "@/assets/dashboard-portraits.jpg";

const assets = {
  "--dashboard-hero-image": `url(${cityImage})`,
  "--dashboard-worlds-image": `url(${worldsImage})`,
  "--dashboard-portraits-image": `url(${portraitsImage})`,
} as CSSProperties;

function SectionTitle({ icon: Icon, title, action }: { icon: typeof Compass; title: string; action?: string }) {
  return (
    <header className="flex h-9 items-center gap-2 border-b border-dashboard-line px-4">
      <Icon aria-hidden className="size-4 text-dashboard-gold" strokeWidth={1.45} />
      <h2 className="dashboard-heading font-body text-lg">{title}</h2>
      {action && (
        <a href="#" className="dc-focus ml-auto flex items-center gap-1 text-xs text-dashboard-gold hover:text-dashboard-gold-soft">
          {action}<ChevronRight aria-hidden className="size-3" />
        </a>
      )}
    </header>
  );
}

function WorldTile({ world }: { world: DashboardWorld }) {
  return (
    <Link to={world.href} className="dc-focus group relative min-h-28 overflow-hidden rounded-md border border-dashboard-line">
      <span aria-hidden data-image-index={world.imageIndex} className="dashboard-world-crop absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
      <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_18%,rgba(2,12,18,.94)_100%)]" />
      <span className="absolute inset-x-0 bottom-0 p-3">
        <strong className="block font-body text-base font-normal text-dashboard-gold-soft">{world.name}</strong>
        <span className="mt-1 block text-[11px] text-dashboard-copy">{world.progress}</span>
      </span>
    </Link>
  );
}

export function DashboardHome({ data }: { data: DashboardMock }) {
  return (
    <div style={assets} className="dashboard-shell min-h-screen bg-dashboard-bg p-2 font-body text-dashboard-copy">
      <div className="dashboard-desktop-grid mx-auto grid max-w-[1720px] grid-cols-[108px_minmax(0,1fr)_308px] gap-3">
        <DashboardRail navigation={data.navigation} />

        <main className="dashboard-main min-w-0 space-y-3">
          <header className="relative flex h-[62px] items-center overflow-hidden px-2">
            <div>
              <p className="text-xs text-dashboard-gold">{data.product}</p>
              <h1 className="dashboard-heading font-body text-2xl leading-none">{data.chronicle}</h1>
            </div>
            <span aria-hidden className="absolute inset-y-0 right-0 w-2/3 bg-[linear-gradient(90deg,transparent,rgba(2,16,23,.2))]" />
          </header>

          <DashboardPanel className="grid min-h-[205px] grid-cols-[.78fr_1.22fr] gap-5 p-5 max-lg:grid-cols-1">
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="dashboard-heading font-body text-4xl leading-none">{data.greeting}</h2>
                <p className="mt-4 max-w-sm text-base italic leading-snug text-dashboard-copy">{data.introduction}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {data.primaryActions.map((action) => (
                  <Button key={action.label} variant="outline" className="h-11 border-dashboard-line bg-dashboard-panel-soft px-5 font-body text-dashboard-gold-soft hover:bg-dashboard-panel hover:text-dashboard-gold-soft">
                    {action.icon === "spark" ? <Sparkles aria-hidden /> : <Feather aria-hidden />}{action.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="relative min-h-44 overflow-hidden rounded-md border border-dashboard-line">
              <img src={cityImage} width={1536} height={768} alt="" className="absolute inset-0 size-full object-cover" />
              <span aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,15,22,.2),rgba(2,15,22,.88))]" />
              <span className="absolute left-4 top-3 rounded-sm border border-dashboard-line bg-dashboard-panel/80 px-3 py-1 text-[10px] uppercase text-dashboard-gold-soft">{data.lastWorld.eyebrow}</span>
              <div className="absolute inset-y-0 right-0 flex w-[58%] flex-col justify-center p-5">
                <h3 className="dashboard-heading text-2xl">{data.lastWorld.name}</h3>
                <p className="mt-2 flex items-center gap-2 text-sm"><Sparkles aria-hidden className="size-4 text-dashboard-gold" />{data.lastWorld.progress}</p>
                <p className="mt-1 flex items-center gap-2 text-sm"><Clock3 aria-hidden className="size-4 text-dashboard-gold" />{data.lastWorld.time}</p>
                <Button asChild className="mt-4 self-end border border-dashboard-gold bg-dashboard-panel-soft font-body text-dashboard-gold-soft shadow-[inset_0_0_14px_rgba(200,131,47,.25)] hover:bg-dashboard-panel-soft">
                  <Link to={data.lastWorld.href}>{data.lastWorld.action}<ArrowRight aria-hidden /></Link>
                </Button>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <SectionTitle icon={Compass} title={data.worldsSection.title} action={data.worldsSection.action} />
            <div className="grid grid-cols-5 gap-3 p-3">
              {data.worldsSection.worlds.map((world) => <WorldTile key={world.name} world={world} />)}
              <a href="#" className="dc-focus flex min-h-28 flex-col items-center justify-center rounded-md border border-dashed border-dashboard-line text-dashboard-copy hover:text-dashboard-gold-soft">
                <Plus aria-hidden className="mb-2 size-8 rounded-full border border-dashboard-gold p-1 text-dashboard-gold" />
                <span>{data.worldsSection.createLabel}</span>
              </a>
            </div>
          </DashboardPanel>

          <div className="grid grid-cols-[1.05fr_.68fr_1.35fr] gap-3 max-xl:grid-cols-2">
            <DashboardPanel className="min-h-[230px]">
              <SectionTitle icon={UsersRound} title={data.charactersSection.title} action={data.charactersSection.action} />
              <div className="grid grid-cols-4 gap-3 p-4">
                {data.charactersSection.characters.map((character) => (
                  <article key={character.name} className="min-w-0 text-center">
                    <div data-image-index={character.imageIndex} className="dashboard-portrait-crop relative mx-auto aspect-square w-full max-w-[76px] rounded-full border border-dashboard-gold bg-cover">
                      <span className={`absolute bottom-0 right-1 size-2.5 rounded-full border border-dashboard-bg ${character.online ? "bg-dashboard-green" : "bg-dashboard-copy"}`} />
                    </div>
                    <h3 className="mt-2 text-base text-dashboard-gold-soft">{character.name}</h3>
                    <p className="truncate text-[10px]">{character.role}</p>
                  </article>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel className="min-h-[230px]">
              <SectionTitle icon={Settings} title={data.modsSection.title} />
              <ul className="p-2">
                {data.modsSection.entries.map((entry) => (
                  <li key={entry.name} className="flex items-center gap-2 border-b border-dashboard-line/50 px-1 py-2 text-[11px]">
                    <Puzzle aria-hidden className="size-3 text-dashboard-gold" />
                    <span className="truncate">{entry.name}</span>
                    <span className="ml-auto text-[9px] text-dashboard-green">● {entry.state}</span>
                  </li>
                ))}
              </ul>
              <a href="#" className="dc-focus mx-2 flex items-center justify-center gap-2 rounded-md border border-dashboard-line py-2 text-xs text-dashboard-gold"><Settings aria-hidden className="size-3" />{data.modsSection.action}<ChevronRight aria-hidden className="size-3" /></a>
            </DashboardPanel>

            <DashboardPanel className="min-h-[230px] overflow-hidden max-xl:col-span-2">
              <img src={cityImage} loading="lazy" width={1536} height={768} alt="" className="absolute inset-0 size-full object-cover opacity-60" />
              <span aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,15,22,.98)_0%,rgba(2,15,22,.88)_55%,rgba(2,15,22,.2))]" />
              <div className="relative p-5">
                <span className="float-right rounded-full border border-dashboard-line px-3 py-1 text-[10px] text-dashboard-gold-soft">{data.updatesSection.badge}</span>
                <h2 className="dashboard-heading text-xl">{data.updatesSection.title}</h2>
                <h3 className="mt-4 text-2xl text-dashboard-gold-soft">{data.updatesSection.headline}</h3>
                <ul className="mt-2 space-y-1 text-[11px]">
                  {data.updatesSection.entries.map((entry) => <li key={entry} className="flex gap-2"><Sparkles aria-hidden className="mt-0.5 size-3 shrink-0 text-dashboard-gold" />{entry}</li>)}
                </ul>
                <a href="#" className="dc-focus mt-4 flex w-52 items-center justify-center gap-3 rounded-md border border-dashboard-gold bg-dashboard-panel-soft py-2 text-dashboard-gold-soft">{data.updatesSection.action}<ArrowRight aria-hidden className="size-4" /></a>
              </div>
            </DashboardPanel>
          </div>
        </main>

        <aside className="dashboard-aside space-y-3 pt-1">
          <div className="flex h-[58px] items-center gap-3">
            <CircleHelp aria-hidden className="ml-auto size-7 rounded-full border border-dashboard-gold p-1 text-dashboard-gold" />
            <div className="dashboard-panel flex h-12 min-w-48 items-center gap-3 px-3">
              <div data-image-index="0" className="dashboard-portrait-crop size-8 rounded-full border border-dashboard-line" />
              <div><strong className="block font-normal text-dashboard-gold-soft">{data.profile.name}</strong><span className="text-[10px] text-dashboard-copy"><i className="mr-1 inline-block size-1.5 rounded-full bg-dashboard-green" />{data.profile.status}</span></div>
              <ChevronDown aria-hidden className="ml-auto size-4 text-dashboard-gold" />
            </div>
          </div>

          <DashboardPanel>
            <SectionTitle icon={UserRound} title={data.accountSection.title} />
            <div className="m-3 rounded-md border border-dashboard-line p-3 text-xs">
              <div className="flex"><div><span className="block text-dashboard-gold-soft">{data.accountSection.planLabel}</span><small>{data.accountSection.renewal}</small></div><span className="ml-auto flex items-center gap-1 text-dashboard-gold-soft"><Crown aria-hidden className="size-4" />{data.accountSection.planName}</span></div>
            </div>
            <ul className="px-3 pb-3">
              {data.accountSection.links.map((link, index) => <li key={link}><a href="#" className="dc-focus flex items-center border-b border-dashboard-line/60 py-2 text-xs hover:text-dashboard-gold-soft">{index === 0 ? <UserRound aria-hidden className="mr-2 size-3 text-dashboard-gold" /> : index === 1 ? <BookOpen aria-hidden className="mr-2 size-3 text-dashboard-gold" /> : <Settings aria-hidden className="mr-2 size-3 text-dashboard-gold" />}{link}<ChevronRight aria-hidden className="ml-auto size-3 text-dashboard-gold" /></a></li>)}
            </ul>
          </DashboardPanel>

          <DashboardPanel>
            <SectionTitle icon={Compass} title={data.discoverSection.title} />
            <div className="space-y-2 p-3">
              {data.discoverSection.entries.map((entry) => (
                <a href="#" key={entry.title} className="dc-focus flex h-14 items-center overflow-hidden rounded-md border border-dashboard-line">
                  <span data-image-index={entry.imageIndex} className="dashboard-world-crop h-full w-16 shrink-0" />
                  <span className="min-w-0 px-3"><strong className="block font-normal text-dashboard-gold-soft">{entry.title}</strong><small className="block truncate">{entry.description}</small></span>
                  <ChevronRight aria-hidden className="ml-auto mr-2 size-4 text-dashboard-gold" />
                </a>
              ))}
            </div>
          </DashboardPanel>
        </aside>
      </div>
    </div>
  );
}