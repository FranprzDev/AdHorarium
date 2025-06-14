# Plan de Implementación: Sistema de Materias y Correlativas

## Resumen del Sistema

Este documento detalla la implementación de un sistema completo de materias con correlativas y estados de progreso académico. El sistema permitirá a los estudiantes:

- Ver las materias disponibles según su carrera
- Entender las correlativas necesarias para cursar cada materia
- Registrar su progreso en cada materia (CURSANDO, REGULAR, APROBADA)
- Visualizar qué materias pueden cursar basándose en sus materias aprobadas

## Estados de Materias

### Estados Definidos
- **CURSANDO**: El estudiante está actualmente cursando la materia
- **REGULAR**: El estudiante completó la cursada en condición regular (debe rendir final)
- **APROBADA**: La materia está completamente aprobada (por final o promoción)

### Reglas de Correlativas
- `para_cursar_aprobar`: Materias que deben estar APROBADAS para cursar la materia
- `para_cursar_cursar`: Materias que deben estar CURSANDO o superior para cursar la materia

## 1. Cambios en la Base de Datos

### 1.1 Nueva Tabla: student_subjects
```sql
CREATE TABLE public.student_subjects (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id BIGINT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('CURSANDO', 'REGULAR', 'APROBADA')),
  enrolled_date DATE,
  completed_date DATE,
  final_exam_date DATE,
  grade NUMERIC(3,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);
```

### 1.2 Tabla de Correlativas
```sql
CREATE TABLE public.subject_correlatives (
  id BIGSERIAL PRIMARY KEY,
  subject_id BIGINT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  correlative_subject_id BIGINT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  requirement_type VARCHAR(20) NOT NULL CHECK (requirement_type IN ('APROBAR', 'CURSAR')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subject_id, correlative_subject_id, requirement_type)
);
```

### 1.3 Índices para Optimización
```sql
CREATE INDEX idx_student_subjects_student_id ON public.student_subjects(student_id);
CREATE INDEX idx_student_subjects_status ON public.student_subjects(status);
CREATE INDEX idx_subject_correlatives_subject_id ON public.subject_correlatives(subject_id);
CREATE INDEX idx_subject_correlatives_correlative ON public.subject_correlatives(correlative_subject_id);
```

### 1.4 RLS Policies
```sql
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_correlatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subject progress" ON public.student_subjects
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Users can insert own subject progress" ON public.student_subjects
FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update own subject progress" ON public.student_subjects
FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Everyone can view correlatives" ON public.subject_correlatives
FOR SELECT USING (true);
```

## 2. Nuevos Tipos TypeScript

### 2.1 Actualizar types/course.ts
```typescript
export enum SubjectStatus {
  CURSANDO = 'CURSANDO',
  REGULAR = 'REGULAR',
  APROBADA = 'APROBADA'
}

export enum CorrelativeType {
  APROBAR = 'APROBAR',
  CURSAR = 'CURSAR'
}

export interface Subject {
  id: number
  name: string
  career_id: number
  exam_table_id?: number
  created_at?: string
  updated_at?: string
}

export interface SubjectCorrelative {
  id: number
  subject_id: number
  correlative_subject_id: number
  requirement_type: CorrelativeType
  correlative_subject?: Subject
}

export interface StudentSubject {
  id: number
  student_id: string
  subject_id: number
  status: SubjectStatus
  enrolled_date?: string
  completed_date?: string
  final_exam_date?: string
  grade?: number
  notes?: string
  created_at: string
  updated_at: string
  subject?: Subject
}

export interface SubjectWithProgress {
  subject: Subject
  progress?: StudentSubject
  correlatives: SubjectCorrelative[]
  canEnroll: boolean
  missingCorrelatives: Subject[]
}
```

## 3. Store de Zustand para Materias

### 3.1 stores/useSubjectsStore.ts
```typescript
import { create } from 'zustand'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { Subject, StudentSubject, SubjectWithProgress, SubjectStatus } from '@/types/course'

interface SubjectsState {
  subjects: Subject[]
  studentSubjects: StudentSubject[]
  subjectsWithProgress: SubjectWithProgress[]
  isLoading: boolean
  error: string | null
  
  fetchSubjects: (careerId: number) => Promise<void>
  fetchStudentProgress: (userId: string) => Promise<void>
  updateSubjectStatus: (subjectId: number, status: SubjectStatus, data?: Partial<StudentSubject>) => Promise<void>
  getAvailableSubjects: () => SubjectWithProgress[]
  getSubjectProgress: (subjectId: number) => StudentSubject | undefined
  clearData: () => void
}

export const useSubjectsStore = create<SubjectsState>()((set, get) => ({
  subjects: [],
  studentSubjects: [],
  subjectsWithProgress: [],
  isLoading: false,
  error: null,

  fetchSubjects: async (careerId: number) => {
    set({ isLoading: true, error: null })
    const supabase = getSupabaseBrowserClient()
    
    try {
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .or(`career_id.eq.${careerId},career_id.eq.6`)
        .order('name')

      if (subjectsError) throw subjectsError

      const { data: correlatives, error: correlativesError } = await supabase
        .from('subject_correlatives')
        .select(`
          *,
          correlative_subject:correlative_subject_id(*)
        `)

      if (correlativesError) throw correlativesError

      const subjectsWithCorrelatives = subjects.map(subject => ({
        subject,
        correlatives: correlatives.filter(c => c.subject_id === subject.id),
        canEnroll: false,
        missingCorrelatives: []
      }))

      set({ 
        subjects: subjects || [],
        subjectsWithProgress: subjectsWithCorrelatives
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido' })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchStudentProgress: async (userId: string) => {
    const supabase = getSupabaseBrowserClient()
    
    try {
      const { data: studentSubjects, error } = await supabase
        .from('student_subjects')
        .select(`
          *,
          subject:subject_id(*)
        `)
        .eq('student_id', userId)

      if (error) throw error

      set({ studentSubjects: studentSubjects || [] })
      
      get().updateAvailableSubjects()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error cargando progreso' })
    }
  },

  updateSubjectStatus: async (subjectId: number, status: SubjectStatus, data = {}) => {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Usuario no autenticado')

    try {
      const updateData = {
        student_id: user.id,
        subject_id: subjectId,
        status,
        updated_at: new Date().toISOString(),
        ...data
      }

      const { error } = await supabase
        .from('student_subjects')
        .upsert(updateData, { onConflict: 'student_id,subject_id' })

      if (error) throw error

      await get().fetchStudentProgress(user.id)
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error actualizando materia' })
    }
  },

  updateAvailableSubjects: () => {
    const { subjects, studentSubjects } = get()
    const { subjectsWithProgress } = get()

    const updatedSubjects = subjectsWithProgress.map(item => {
      const progress = studentSubjects.find(ss => ss.subject_id === item.subject.id)
      
      const canEnroll = item.correlatives.every(correlative => {
        const correlativeProgress = studentSubjects.find(
          ss => ss.subject_id === correlative.correlative_subject_id
        )
        
        if (correlative.requirement_type === 'APROBAR') {
          return correlativeProgress?.status === 'APROBADA'
        } else {
          return correlativeProgress && ['CURSANDO', 'REGULAR', 'APROBADA'].includes(correlativeProgress.status)
        }
      })

      const missingCorrelatives = item.correlatives
        .filter(correlative => {
          const correlativeProgress = studentSubjects.find(
            ss => ss.subject_id === correlative.correlative_subject_id
          )
          
          if (correlative.requirement_type === 'APROBAR') {
            return correlativeProgress?.status !== 'APROBADA'
          } else {
            return !correlativeProgress || !['CURSANDO', 'REGULAR', 'APROBADA'].includes(correlativeProgress.status)
          }
        })
        .map(correlative => correlative.correlative_subject)
        .filter(Boolean)

      return {
        ...item,
        progress,
        canEnroll: canEnroll || !!progress,
        missingCorrelatives
      }
    })

    set({ subjectsWithProgress: updatedSubjects })
  },

  getAvailableSubjects: () => {
    return get().subjectsWithProgress.filter(item => item.canEnroll && !item.progress)
  },

  getSubjectProgress: (subjectId: number) => {
    return get().studentSubjects.find(ss => ss.subject_id === subjectId)
  },

  clearData: () => {
    set({
      subjects: [],
      studentSubjects: [],
      subjectsWithProgress: [],
      isLoading: false,
      error: null
    })
  }
}))
```

## 4. Componentes de UI

### 4.1 components/subjects/SubjectCard.tsx
```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SubjectWithProgress, SubjectStatus } from '@/types/course'
import { CheckCircle, Clock, BookOpen, AlertCircle } from 'lucide-react'

interface SubjectCardProps {
  subjectData: SubjectWithProgress
  onStatusChange: (subjectId: number, status: SubjectStatus) => void
}

export function SubjectCard({ subjectData, onStatusChange }: SubjectCardProps) {
  const { subject, progress, canEnroll, missingCorrelatives } = subjectData

  const getStatusIcon = () => {
    if (!progress) return null
    
    switch (progress.status) {
      case SubjectStatus.APROBADA:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case SubjectStatus.REGULAR:
        return <Clock className="h-4 w-4 text-yellow-600" />
      case SubjectStatus.CURSANDO:
        return <BookOpen className="h-4 w-4 text-blue-600" />
    }
  }

  const getStatusColor = () => {
    if (!progress) return 'default'
    
    switch (progress.status) {
      case SubjectStatus.APROBADA:
        return 'bg-green-100 text-green-800'
      case SubjectStatus.REGULAR:
        return 'bg-yellow-100 text-yellow-800'
      case SubjectStatus.CURSANDO:
        return 'bg-blue-100 text-blue-800'
      default:
        return 'default'
    }
  }

  return (
    <Card className={`transition-all duration-200 ${canEnroll ? 'border-green-200' : 'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium leading-tight">
            {subject.name}
          </CardTitle>
          <div className="flex items-center gap-2 ml-2">
            {getStatusIcon()}
            {progress && (
              <Badge className={getStatusColor()}>
                {progress.status}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {!canEnroll && missingCorrelatives.length > 0 && (
          <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded">
            <div className="flex items-center gap-1 mb-1">
              <AlertCircle className="h-3 w-3 text-amber-600" />
              <span className="text-xs font-medium text-amber-800">
                Correlativas faltantes:
              </span>
            </div>
            <div className="text-xs text-amber-700">
              {missingCorrelatives.map(mc => mc.name).join(', ')}
            </div>
          </div>
        )}

        {progress?.grade && (
          <div className="mb-3 text-sm">
            <span className="font-medium">Nota: </span>
            <span>{progress.grade}</span>
          </div>
        )}

        <div className="flex gap-2">
          {!progress && canEnroll && (
            <Button
              size="sm"
              onClick={() => onStatusChange(subject.id, SubjectStatus.CURSANDO)}
              className="text-xs"
            >
              Marcar como Cursando
            </Button>
          )}
          
          {progress?.status === SubjectStatus.CURSANDO && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange(subject.id, SubjectStatus.REGULAR)}
                className="text-xs"
              >
                Regular
              </Button>
              <Button
                size="sm"
                onClick={() => onStatusChange(subject.id, SubjectStatus.APROBADA)}
                className="text-xs"
              >
                Aprobar
              </Button>
            </>
          )}
          
          {progress?.status === SubjectStatus.REGULAR && (
            <Button
              size="sm"
              onClick={() => onStatusChange(subject.id, SubjectStatus.APROBADA)}
              className="text-xs"
            >
              Rendir Final
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### 4.2 components/subjects/SubjectsGrid.tsx
```typescript
'use client'

import { useEffect } from 'react'
import { useSubjectsStore } from '@/stores/useSubjectsStore'
import { useCareerStore } from '@/stores/useCareerStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { SubjectCard } from './SubjectCard'
import { SubjectStatus } from '@/types/course'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function SubjectsGrid() {
  const { user } = useAuthStore()
  const { careerId } = useCareerStore()
  const {
    subjectsWithProgress,
    isLoading,
    error,
    fetchSubjects,
    fetchStudentProgress,
    updateSubjectStatus
  } = useSubjectsStore()

  useEffect(() => {
    if (careerId) {
      fetchSubjects(careerId)
    }
  }, [careerId, fetchSubjects])

  useEffect(() => {
    if (user?.id) {
      fetchStudentProgress(user.id)
    }
  }, [user?.id, fetchStudentProgress])

  const handleStatusChange = async (subjectId: number, status: SubjectStatus) => {
    await updateSubjectStatus(subjectId, status)
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Cargando materias...</div>
  }

  if (error) {
    return <div className="text-red-600 p-4">Error: {error}</div>
  }

  const approvedSubjects = subjectsWithProgress.filter(s => s.progress?.status === SubjectStatus.APROBADA)
  const regularSubjects = subjectsWithProgress.filter(s => s.progress?.status === SubjectStatus.REGULAR)
  const currentSubjects = subjectsWithProgress.filter(s => s.progress?.status === SubjectStatus.CURSANDO)
  const availableSubjects = subjectsWithProgress.filter(s => s.canEnroll && !s.progress)
  const lockedSubjects = subjectsWithProgress.filter(s => !s.canEnroll && !s.progress)

  return (
    <div className="space-y-6">
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="available">
            Disponibles ({availableSubjects.length})
          </TabsTrigger>
          <TabsTrigger value="current">
            Cursando ({currentSubjects.length})
          </TabsTrigger>
          <TabsTrigger value="regular">
            Regulares ({regularSubjects.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Aprobadas ({approvedSubjects.length})
          </TabsTrigger>
          <TabsTrigger value="locked">
            Bloqueadas ({lockedSubjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableSubjects.map((subjectData) => (
              <SubjectCard
                key={subjectData.subject.id}
                subjectData={subjectData}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="current" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentSubjects.map((subjectData) => (
              <SubjectCard
                key={subjectData.subject.id}
                subjectData={subjectData}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="regular" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularSubjects.map((subjectData) => (
              <SubjectCard
                key={subjectData.subject.id}
                subjectData={subjectData}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedSubjects.map((subjectData) => (
              <SubjectCard
                key={subjectData.subject.id}
                subjectData={subjectData}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="locked" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedSubjects.map((subjectData) => (
              <SubjectCard
                key={subjectData.subject.id}
                subjectData={subjectData}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

## 5. Script de Migración de Datos

### 5.1 scripts/migrate-correlatives.ts
```typescript
import { createClient } from '@supabase/supabase-js'
import { plan_ing_civil_2023 } from '@/docs/2023/IngCivil'
import { plan_ing_sistemas_2023 } from '@/docs/2023/IngEnSistemas'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface SubjectMapping {
  numero: number
  subjectId: number
}

async function createSubjectMappings(careerPlans: any[]): Promise<Map<number, SubjectMapping[]>> {
  const mappings = new Map<number, SubjectMapping[]>()

  for (const plan of careerPlans) {
    const careerMappings: SubjectMapping[] = []
    
    for (const nivel of plan.regimen_correlatividades) {
      for (const asignatura of nivel.asignaturas) {
        const { data: subject } = await supabase
          .from('subjects')
          .select('id')
          .ilike('name', `%${asignatura.nombre}%`)
          .single()

        if (subject) {
          careerMappings.push({
            numero: asignatura.numero,
            subjectId: subject.id
          })
        }
      }
    }

    mappings.set(plan.carrera_id, careerMappings)
  }

  return mappings
}

async function migrateCorrelatives() {
  console.log('Iniciando migración de correlativas...')

  const careerPlans = [
    { ...plan_ing_civil_2023, carrera_id: 3 },
    { ...plan_ing_sistemas_2023, carrera_id: 1 }
  ]

  const mappings = await createSubjectMappings(careerPlans)

  for (const plan of careerPlans) {
    const careerMapping = mappings.get(plan.carrera_id)
    if (!careerMapping) continue

    console.log(`Procesando ${plan.carrera}...`)

    for (const nivel of plan.regimen_correlatividades) {
      for (const asignatura of nivel.asignaturas) {
        const subjectMapping = careerMapping.find(m => m.numero === asignatura.numero)
        if (!subjectMapping) continue

        const correlatives = [
          ...asignatura.para_cursar_aprobar.map(num => ({ num, type: 'APROBAR' })),
          ...asignatura.para_cursar_cursar.map(num => ({ num, type: 'CURSAR' }))
        ]

        for (const correlative of correlatives) {
          const correlativeMapping = careerMapping.find(m => m.numero === correlative.num)
          if (!correlativeMapping) continue

          const { error } = await supabase
            .from('subject_correlatives')
            .insert({
              subject_id: subjectMapping.subjectId,
              correlative_subject_id: correlativeMapping.subjectId,
              requirement_type: correlative.type
            })

          if (error && !error.message.includes('duplicate')) {
            console.error(`Error insertando correlativa:`, error)
          }
        }
      }
    }
  }

  console.log('Migración completada')
}

migrateCorrelatives().catch(console.error)
```

## 6. Plan de Implementación

### Fase 1: Base de Datos (1-2 días)
1. Crear las nuevas tablas `student_subjects` y `subject_correlatives`
2. Configurar RLS policies
3. Ejecutar script de migración de correlativas
4. Verificar integridad de datos

### Fase 2: Tipos y Store (1-2 días)
1. Actualizar tipos en `types/course.ts`
2. Crear `useSubjectsStore.ts`
3. Integrar con autenticación existente
4. Probar funcionalidad del store

### Fase 3: Componentes UI (2-3 días)
1. Crear `SubjectCard` component
2. Crear `SubjectsGrid` component
3. Implementar sistema de pestañas
4. Añadir feedback visual y estados de carga

### Fase 4: Integración (1-2 días)
1. Integrar componentes en páginas existentes
2. Conectar con `useCareerStore` y `useAuthStore`
3. Probar flujos completos de usuario
4. Optimizar rendimiento

### Fase 5: Testing y Refinamiento (1-2 días)
1. Probar con datos reales
2. Validar lógica de correlativas
3. Mejorar UX basándose en feedback
4. Documentar uso del sistema

## 7. Consideraciones Técnicas

### Performance
- Uso de índices en base de datos para consultas rápidas
- Caching en Zustand store para evitar re-fetching innecesario
- Lazy loading de componentes pesados

### UX/UI
- Estados de carga claros
- Feedback visual inmediato en cambios de estado
- Información contextual sobre correlativas faltantes
- Organización clara por pestañas de estado

### Escalabilidad
- Estructura de base de datos normalizada
- Separación clara de responsabilidades
- Código reutilizable y modular

### Seguridad
- RLS policies para proteger datos de estudiantes
- Validación de permisos en el frontend
- Sanitización de inputs de usuario