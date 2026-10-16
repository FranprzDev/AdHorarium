import { Download, ExternalLink, Puzzle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EXTENSION_CHROME_ZIP_URL, EXTENSION_FIREFOX_ZIP_URL, EXTENSION_RELEASE_URL, SYSACAD_ACADEMIC_STATE_URL } from "@/lib/sysacad/labels"

/** How to install and use the "Llevar a AdHorarium" browser extension. */
export function ImportInstructions() {
  return (
    <section className="surface-card space-y-4 p-4 md:p-6" aria-labelledby="sysacad-extension-title">
      <div className="flex items-center gap-2">
        <Puzzle className="h-5 w-5 text-brand-strong" aria-hidden />
        <h2 id="sysacad-extension-title" className="font-serif text-xl font-semibold text-foreground">
          Con la extensión (recomendado)
        </h2>
      </div>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        <li>Descargá la extensión para tu navegador y descomprimí el archivo.</li>
        <li>
          Chrome o Edge: abrí <code>chrome://extensions</code>, activá el modo de desarrollador y elegí «Cargar
          descomprimida». Firefox: abrí <code>about:debugging</code>, «Este Firefox», «Cargar complemento temporal» y
          elegí el <code>manifest.json</code>.
        </li>
        <li>
          Entrá a{" "}
          <a href={SYSACAD_ACADEMIC_STATE_URL} target="_blank" rel="noreferrer" className="font-medium text-brand-strong underline-offset-4 hover:underline">
            SysAcad
          </a>{" "}
          con tu usuario y abrí «Estado académico».
        </li>
        <li>Tocá «Llevar a AdHorarium». Se abre esta página con tus materias para que revises y confirmes.</li>
      </ol>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <a href={EXTENSION_CHROME_ZIP_URL}>
            <Download className="h-4 w-4" />
            Chrome / Edge
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={EXTENSION_FIREFOX_ZIP_URL}>
            <Download className="h-4 w-4" />
            Firefox
          </a>
        </Button>
        <Button asChild variant="ghost">
          <a href={EXTENSION_RELEASE_URL} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" />
            Ver en GitHub
          </a>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        La extensión solo funciona en la página de Estado académico de SysAcad, no pide tu contraseña y no guarda nada. Tus
        datos viajan en la dirección de esta página (después del #), que no se envía a ningún servidor hasta que confirmás.
      </p>
    </section>
  )
}
