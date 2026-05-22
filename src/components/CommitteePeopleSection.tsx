import { AnimatePresence, motion } from 'motion/react'
import type { Variants } from 'motion/react'
import { useId, useState } from 'react'
import type { CustomPagePerson } from '../context/WebsiteContentContext'

type Props = {
  heading: string
  people: CustomPagePerson[]
}

const listVariants: Variants = {
  open: {
    opacity: 1,
    height: 'auto',
    transition: {
      duration: 0.32,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.12,
    },
  },
  closed: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.22,
      ease: 'easeIn',
      when: 'afterChildren',
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
}

const memberVariants: Variants = {
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.28,
      ease: 'easeOut',
      when: 'beforeChildren',
      delayChildren: 0.12,
      staggerChildren: 0.11,
    },
  },
  closed: {
    opacity: 0,
    y: 18,
    scale: 0.97,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
}

const copyVariants: Variants = {
  open: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: 'easeOut' },
  },
  closed: {
    opacity: 0,
    y: 10,
    transition: { duration: 0.14, ease: 'easeIn' },
  },
}

const imageVariants: Variants = {
  open: {
    opacity: 1,
    scale: [1.16, 0.96, 1],
    transition: {
      opacity: { delay: 0.36, duration: 0.2 },
      scale: { delay: 0.36, duration: 0.68, ease: 'easeOut' },
    },
  },
  closed: {
    opacity: 0,
    scale: 1.16,
    transition: { duration: 0.14, ease: 'easeIn' },
  },
}

export function CommitteePeopleSection({ heading, people }: Props) {
  const panelId = useId()
  const [open, setOpen] = useState(false)

  return (
    <motion.section animate={open ? 'open' : 'closed'} className="w-full max-w-7xl">
      <button
        type="button"
        aria-controls={panelId}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="group flex w-full items-center justify-between gap-4 overflow-hidden rounded-xl border border-[#dcd4ee] bg-white px-5 py-4 text-left shadow-[0_4px_16px_-8px_rgba(36,27,113,0.2)] transition-all hover:border-[#bcb0db] hover:bg-[#fbf9ff] hover:shadow-[0_6px_20px_-8px_rgba(36,27,113,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f] focus-visible:ring-offset-2 md:px-6"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="h-9 w-[3px] shrink-0 rounded-full bg-[#f50057]" aria-hidden />
          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-widest text-[#8b78b8]">Committee</span>
            <span className="mt-0.5 block text-base font-black uppercase tracking-tight text-[#241b71] md:text-lg">
              {heading}
            </span>
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2.5">
          <span className="hidden rounded-full bg-[#f3effc] px-3 py-1 text-xs font-bold text-[#6b5a92] sm:block">
            {people.length} {people.length === 1 ? 'member' : 'members'}
          </span>
          <motion.span
            variants={{ open: { rotate: 180 }, closed: { rotate: 0 } }}
            className="flex size-8 items-center justify-center rounded-lg bg-[#241b71] text-white transition-colors group-hover:bg-[#5a0a8f]"
            aria-hidden
          >
            <span className="material-symbols-outlined text-xl">expand_more</span>
          </motion.span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="members"
            initial="closed"
            animate="open"
            exit="closed"
            variants={listVariants}
            className="overflow-hidden"
          >
            <motion.div className="grid grid-cols-2 gap-3 px-1 pb-4 pt-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {people.map((person, index) => (
                <CommitteeMemberCard key={`${person.name}-${index}`} person={person} />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

function CommitteeMemberCard({ person }: { person: CustomPagePerson }) {
  return (
    <motion.article
      variants={memberVariants}
      className="flex flex-col items-center gap-3 rounded-xl border border-[#e2dcef] bg-white px-3 py-5 text-center shadow-[0_4px_20px_-8px_rgba(36,27,113,0.18)] transition-shadow hover:shadow-[0_8px_28px_-8px_rgba(36,27,113,0.28)]"
    >
      {/* Photo */}
      <motion.div
        variants={imageVariants}
        className="relative size-[88px] shrink-0 overflow-hidden rounded-full border-[3px] border-[#e2dcef] bg-[#f3effc] shadow-sm"
      >
        {person.imageUrl ? (
          <img
            src={person.imageUrl}
            alt={person.name}
            className="h-full w-full object-cover object-top"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
              const fallback = event.currentTarget.nextElementSibling
              if (fallback) fallback.classList.remove('hidden')
            }}
          />
        ) : null}
        <div
          className={`flex h-full w-full items-center justify-center text-[#c5b9dd] ${person.imageUrl ? 'hidden' : ''}`}
        >
          <span className="material-symbols-outlined text-4xl">person</span>
        </div>
      </motion.div>

      {/* Info */}
      <div className="min-w-0 w-full">
        <motion.h3
          variants={copyVariants}
          className="text-[13px] font-black leading-snug tracking-tight text-[#241b71]"
        >
          {person.name}
        </motion.h3>
        <motion.p
          variants={copyVariants}
          className="mt-1.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#665878]"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#f50057]" aria-hidden />
          {person.post}
        </motion.p>
      </div>
    </motion.article>
  )
}
