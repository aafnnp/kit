import { motion } from "motion/react"

interface DashboardHeroProps {
  title: string
  description: string
}

export function DashboardHero({ title, description }: DashboardHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center mb-6 sm:mb-8"
    >
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent leading-tight">
        {title}
      </h1>
      <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 px-2 sm:px-0">{description}</p>
    </motion.div>
  )
}

