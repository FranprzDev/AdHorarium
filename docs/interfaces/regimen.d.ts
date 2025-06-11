interface CorrelatividadAsignatura {
    numero: number;
    nombre: string;
    para_cursar_aprobar: number[];
    para_cursar_cursar: number[]; 
  }
  
  interface NivelCorrelatividades {
    nivel: number | string; 
    asignaturas: CorrelatividadAsignatura[];
  }
  
  export interface RegimenCorrelatividades {
    carrera: string;
    plan: string;
    regimen_correlatividades: NivelCorrelatividades[];
    condiciones_adicionales: {
      proyecto_final: string;
      practica_profesional_supervisada: string;
    };
  }