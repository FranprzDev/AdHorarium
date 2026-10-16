import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PublicHeader } from "@/components/layout/public-header"

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos guarda AdHorarium, para qué los usa y cómo pedir su eliminación.",
}

const LAST_UPDATED = "16 de octubre de 2026"
const CONTACT_EMAIL = "franciscoperezdeveloper@gmail.com"
const REPOSITORY_ISSUES_URL = "https://github.com/FranprzDev/AdHorarium/issues"

type PolicySection = {
  title: string
  paragraphs: string[]
  items?: string[]
}

const SECTIONS: PolicySection[] = [
  {
    title: "Quién es responsable",
    paragraphs: [
      "AdHorarium es un proyecto académico de código abierto para estudiantes de ingeniería de la UTN Facultad Regional Tucumán, desarrollado por Francisco Miguel Perez. No es un servicio oficial de la universidad.",
    ],
  },
  {
    title: "Qué datos guardamos",
    paragraphs: ["Cuando creás tu cuenta o iniciás sesión guardamos únicamente:"],
    items: [
      "Tu nombre y tu dirección de correo electrónico.",
      "Si te registrás con email y contraseña, un hash de tu contraseña (bcrypt): nunca guardamos ni registramos la contraseña en texto plano.",
      "Si ingresás con Google, la URL de tu foto de perfil, el identificador de tu cuenta de Google y los datos técnicos del inicio de sesión que Google devuelve, necesarios para vincular tu cuenta.",
      "La carrera que elegís dentro de la aplicación.",
      "El estado de cada materia que cargás (no cursada, cursando, regular o promocionada) y las notas que ingresás.",
      "Tu rol en la aplicación (estudiante o administrador).",
      "Si confirmaste tu email, la fecha de confirmación, y los enlaces de un solo uso que te enviamos por email (confirmación o recuperación de contraseña), guardados como hash hasta que se usan o vencen.",
    ],
  },
  {
    title: "Para qué los usamos",
    paragraphs: [
      "Usamos estos datos solo para que puedas iniciar sesión y para mostrarte tu progreso académico: el plan de correlativas con el estado de tus materias, las materias que podés cursar, tu promedio y su equivalencia GPA. No los usamos con fines publicitarios ni para elaborar perfiles.",
      "La sesión se mantiene con una cookie propia de inicio de sesión. No usamos cookies de publicidad ni de seguimiento.",
      "Para saber qué páginas se usan y qué tan rápido cargan usamos Vercel Web Analytics y Speed Insights, que no usan cookies ni guardan datos que te identifiquen: solo registran la página visitada (sin parámetros de la URL ni el código de los horarios compartidos), la ubicación aproximada (país y ciudad), el navegador, el tipo de dispositivo y métricas de rendimiento, de forma agregada.",
    ],
  },
  {
    title: "Importación desde SysAcad",
    paragraphs: [
      "Si usás «Importar desde SysAcad», la extensión de AdHorarium para el navegador lee la tabla de la página de Estado académico de SysAcad (UTN FRT) que ya tenés abierta, solo cuando tocás «Llevar a AdHorarium». No pide ni ve tu usuario o contraseña de SysAcad, no guarda nada en el navegador y no envía datos a ningún otro sitio.",
      "Los datos (año, nombre, estado, nota y plan de cada materia) viajan dentro de la dirección de la página de importación, después del signo #: esa parte de la dirección no se envía a ningún servidor. La página los lee en tu navegador y, mientras iniciás sesión, los conserva solo en el almacenamiento de esa pestaña. Lo mismo pasa si pegás la tabla a mano.",
      "Solo cuando confirmás la importación guardamos en tu cuenta el estado y la nota de las materias que elegiste, igual que si los cargaras vos. No guardamos tu legajo, el tomo y folio de las actas, las comisiones ni ninguna otra información de SysAcad.",
    ],
  },
  {
    title: "Con quién los compartimos",
    paragraphs: [
      "No vendemos ni compartimos tus datos con terceros. Los datos se alojan en los proveedores de infraestructura que hacen funcionar el sitio: Vercel (alojamiento de la aplicación) y Neon (base de datos PostgreSQL). Google interviene solo si elegís ingresar con tu cuenta de Google. Los emails de la cuenta (confirmación de email y recuperación de contraseña) se envían a través de Brevo, que recibe solo tu dirección de correo y el contenido de ese email.",
    ],
  },
  {
    title: "Tus derechos y cómo eliminar tu cuenta",
    paragraphs: [
      "La Ley 25.326 de Protección de los Datos Personales te reconoce los derechos de acceso, rectificación, actualización y supresión de tus datos.",
      "Derecho de supresión: podés eliminar tu cuenta vos mismo en cualquier momento desde Mi Perfil › Eliminar mi cuenta. Te pedimos tu contraseña (o tu email, si ingresás con Google) para confirmar. La eliminación es inmediata y definitiva: borra tu cuenta, tu nombre y email, el hash de tu contraseña, la vinculación con Google, la carrera elegida, los estados y notas de tus materias, tu horario, los enlaces de horario que compartiste (dejan de funcionar) y los enlaces de verificación o recuperación pendientes, y cierra tu sesión. Las copias de seguridad técnicas del proveedor de base de datos pueden conservar esos datos por un período limitado, hasta que se renuevan.",
      `Si no podés ingresar a tu cuenta, también podés pedir la eliminación, una copia de tus datos o su corrección escribiendo a ${CONTACT_EMAIL} o abriendo un issue en el repositorio del proyecto. Respondemos los pedidos de rectificación o supresión dentro de los cinco días hábiles que fija el artículo 16 de la ley, y el acceso a tus datos es gratuito a intervalos no inferiores a seis meses, salvo interés legítimo (artículo 14).`,
      "La Agencia de Acceso a la Información Pública (AAIP), órgano de control de la Ley 25.326, atiende las denuncias y reclamos de quienes consideren afectados sus derechos sobre sus datos personales.",
    ],
  },
  {
    title: "Cambios en esta política",
    paragraphs: ["Si esta política cambia, publicaremos la nueva versión en esta misma página con su fecha de actualización."],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        <Link href="/" className="mb-8 inline-flex min-h-6 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
        <p className="eyebrow mb-3">AdHorarium</p>
        <h1 className="mb-3 font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">Política de privacidad</h1>
        <p className="mb-10 text-sm text-muted-foreground">Última actualización: {LAST_UPDATED}</p>
        <div className="surface-card space-y-10 p-6 md:p-10">
          {SECTIONS.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="font-serif text-2xl font-semibold text-foreground">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              ))}
              {section.items && (
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold text-foreground">Contacto</h2>
            <p className="text-muted-foreground leading-relaxed">
              Correo:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary underline underline-offset-4 hover:text-foreground">
                {CONTACT_EMAIL}
              </a>
              <br />
              Issues del repositorio:{" "}
              <a href={REPOSITORY_ISSUES_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4 hover:text-foreground">
                github.com/FranprzDev/AdHorarium/issues
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
