// components/AnimatedSentence.tsx
"use client"

import { motion } from "framer-motion"

export function AnimatedSentence({ text }: { text: string }) {
  const words = text.split(" ")

  return (
    <p className="flex flex-wrap text-lg font-semibold">
      {words.map((word: string, i: number) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.95, delay: i * 0.15 }}
        >
          {word}&nbsp;
        </motion.span>
      ))}
    </p>
  )
}