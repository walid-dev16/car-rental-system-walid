import React, { useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export default function LuxuryShowcase() {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const imageScale = useTransform(smoothProgress, [0, 1], [1.1, 1]);
  const imageOpacity = useTransform(smoothProgress, [0, 0.8, 1], [1, 0.9, 0.8]);
  const imageBlur = useTransform(smoothProgress, [0, 0.5], ["blur(0px)", "blur(4px)"]);

  const textY = useTransform(smoothProgress, [0, 0.5], [0, -80]);
  const textOpacity = useTransform(smoothProgress, [0, 0.4], [1, 0]);
  const cardY = useTransform(smoothProgress, [0, 0.6], [0, 100]);

  return (
    <section 
      ref={sectionRef} 
      className="relative bg-black w-full" 
      style={{ height: "160vh" }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        <motion.div 
          style={{ 
            scale: imageScale, 
            opacity: imageOpacity, 
            filter: imageBlur 
          }} 
          className="absolute inset-0 z-0 h-full w-full"
        >
          <img
            src="https://img.sixt.com/2800/40da47cb-e2a0-415f-b18f-d2f59cb05b8d.jpg"
            alt="Luxury cars"
            className="h-full w-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        </motion.div>

        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="relative z-10 flex flex-col items-center justify-center px-6 text-center w-full"
        >
          <div className="max-w-screen-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.5em] text-orange-500">
              Exclusively Porsche
            </p>

            <h2 className="text-6xl font-black leading-[0.9] text-white md:text-[8rem] lg:text-[10rem] uppercase tracking-tighter">
              Precision <br /> 
              <span className="text-white/80">Luxury</span>
            </h2>

            <p className="mx-auto mt-10 max-w-2xl text-lg text-gray-300">
              Experience the pinnacle of automotive engineering with our curated collection.
            </p>

            <motion.div 
              style={{ y: cardY }}
              className="mt-16 grid w-full max-w-6xl gap-6 md:grid-cols-3 mx-auto"
            >
              {[
                { t: "Power", d: "Unmatched performance." },
                { t: "Design", d: "A silhouette that commands respect." },
                { t: "Comfort", d: "Tailored for the modern explorer." }
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl transition-all hover:bg-black/60"
                >
                  <h3 className="text-2xl font-bold text-white">{item.t}</h3>
                  <p className="mt-2 text-sm text-gray-400">{item.d}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}