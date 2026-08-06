import { useEffect } from 'react'
import { useLang } from '../lang'
import { Footer, Nav } from '../components/Chrome'
import Hero from '../components/Hero'
import { Authorities, HowItWorks, MapPreview, Product, Statistic } from '../components/Sections'
import { Significance, Traces } from '../components/Story'

export default function Landing() {
  const { lang, copy, setLang } = useLang()

  useEffect(() => {
    document.title = `Catchy — ${copy.footer.tagline}`
  }, [copy])

  return (
    <div className="min-h-[100dvh]">
      <Nav copy={copy} lang={lang} onLang={setLang} />
      <main key={lang}>
        <Hero copy={copy} />
        <Significance copy={copy} />
        <Statistic copy={copy} />
        <Traces copy={copy} />
        <HowItWorks copy={copy} />
        <Product copy={copy} />
        <MapPreview copy={copy} />
        <Authorities copy={copy} />
      </main>
      <Footer copy={copy} />
    </div>
  )
}
