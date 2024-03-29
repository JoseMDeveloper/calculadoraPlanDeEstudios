
const fs = require('fs');


const saveDB = (path, data) => fs.writeFileSync(path, JSON.stringify(data));

const readDB = (path) => {
    if (!fs.existsSync(path))
        return {};
    const objeto = fs.readFileSync(path, {encoding: "utf-8"}); 
    return (objeto === '')? {} :JSON.parse(objeto);
}

const clasesJsonGet = (req, res) => res.json(readDB('./public/json/clases.json'));

const clasesJsonPut = (req, res) => {
    const { codigo, semestre, profesor, nota } = req.body;
    const clases = readDB('./public/json/clases.json');

    clases[codigo].semestre = semestre;
    clases[codigo].profesor = profesor;
    clases[codigo].nota = nota;
    clases[codigo].registro = true;

    saveDB('./public/json/clases.json', clases);
    res.json({msg: 'La información de su clase se guardo correctamente'});
}

const clasesJsonDelete = (req, res) => {
    const { codigo } = req.body;
    const clases = readDB('./public/json/clases.json');

    clases[codigo].semestre = 0;
    clases[codigo].profesor = '';
    clases[codigo].nota = 0;
    clases[codigo].registro = false;

    saveDB('./public/json/clases.json', clases);
    res.json({msg: 'La información de su clase se eliminó correctamente'});
} 

const carreraJsonGet = (req, res) => res.json(readDB('./public/json/mi-carrera.json'));

const carreraJsonPut = (req, res) => {
    let { codigo, semestre, nota, profesor } = req.body;
    const clases = readDB('./public/json/clases.json');
    const clase = clases[codigo];
    
    clase.id = codigo;
    clase.nota = nota;
    clase.aprobada = nota >= 3.0;
    if (profesor)
        clase.profesor = profesor;
    clase.semestre = semestre;

    semestre--;

    const carrera = readDB('./public/json/mi-carrera.json');

    if (semestre >= 0) {
        carrera.semestres.forEach(sem => {
            const index = sem.materias.findIndex(element => codigo === element.id);
            if (index != -1) {
                sem.materias.splice(index, 1);
                return;
            }
        });
        if (!carrera.semestres[semestre]) {
            carrera.semestres[semestre] = {
                definitiva: 0,
                materias: [clase]
            };
        } else {
            const index = carrera.semestres[semestre].materias.findIndex(element => codigo === element.id);
            (index == -1)
                ? carrera.semestres[semestre].materias.push(clase)
                : carrera.semestres[semestre].materias[index] = clase;
        }
        saveDB('./public/json/mi-carrera.json', carrera);
        res.json({msg: 'La información de su clase se guardo correctamente'});
    } else {
        res.status(400).json({errors: ['El semestre ingresado es inválido']});
    }
}
const carreraJsonPost = (req, res) => {
    let { codigo, semestre, definitiva, tipo, creditos, nombre, departamento, profesor } = req.body;
    const carrera = readDB('./public/json/mi-carrera.json');
    
    carrera.semestres.forEach(semestre => {
        if (semestre.materias.find(materia => {
            return codigo === materia.id
        })) {
            return res.status(400).json({message: "ya existe una materia con ese id"})
        }
    });

    clase = {
        nombre,
        id: codigo,
        semestre,
        nota: {
            definitiva,
            notas:[]
        },
        aprobada:definitiva >= 3.0,
        profesor,
        departamento,
        tipo,
        creditos,
        registro: true
    }
    semestre--;

    if (semestre < 0) {
        return res.status(400).json({errors: ['El semestre ingresado es inválido']});
    }

    if (!carrera.semestres[semestre]) {
        carrera.semestres[semestre] = {
            definitiva: 0,
            materias: [clase]
        };
    } else {
        carrera.semestres[semestre].materias.push(clase);
    }        
    saveDB('./public/json/mi-carrera.json', carrera);
    res.json({msg: 'La información de su clase se guardo correctamente'});

}
const modificarDefinitivaSemestre = (req, res) => {
    const { semestre, nuevaDefinitiva } = req.body;
  
    const carrera = readDB('./public/json/mi-carrera.json');
  
    const semestreIndex = semestre;
    if (carrera.semestres[semestreIndex]) {
      carrera.semestres[semestreIndex].definitiva = nuevaDefinitiva;
      saveDB('./public/json/mi-carrera.json', carrera);
      res.json({ msg: 'Definitiva del semestre actualizada correctamente' });
    } else {
      res.status(400).json({ msg: 'Semestre no encontrado' });
    }
};


const carreraJsonDelete = (req, res) => {
    let { codigo, semestre } = req.body;
    
    const carrera = readDB('./public/json/mi-carrera.json');

    semestre--;

    if (carrera.semestres[semestre]) {
        const index = carrera.semestres[semestre].materias.findIndex(element => codigo === element.id);

        if (index === -1)
            return res.status(404).json({msg: 'Clase no encontrada'});

        const elim = carrera.semestres[semestre].materias[index];
        
        carrera.semestres[semestre].materias.splice(index, 1);

        saveDB('./public/json/mi-carrera.json', carrera);
        res.json({msg: 'La información de su clase se eliminó correctamente'});

    } else {
        res.status(400).json({errors: 'El código de clase no existe en el semestre ingresado'});
    }
} 

const clasesRespaldoJsonGet = (req, res) => res.json(readDB('./database/clases-respaldo.json'));

const carreraJsonPutNueva = (req, res) => {
    let { codigo, semestre, nota, profesor } = req.body;

    let clase;

    semestre--;

    const carrera = readDB('./public/json/mi-carrera.json');

    if (semestre >= 0) {
        carrera.semestres.forEach(sem => {
            const index = sem.materias.findIndex(element => codigo === element.id);
            if (index != -1) {
                clase = sem.materias[index];
                clase.nota = nota;
                clase.aprobada = nota >= 3.0;
                if (profesor)
                    clase.profesor = profesor;
                clase.semestre = semestre + 1;
                sem.materias.splice(index, 1);
                return;
            }
        });
        if (clase === undefined) {
            return res.status(404).json({msg: 'Clase no encontrada'});
        }
        if (!carrera.semestres[semestre]) {
            carrera.semestres[semestre] = {
                definitiva: 0,
                materias: [clase]
            };
        } else {
            const index = carrera.semestres[semestre].materias.findIndex(element => codigo === element.id);
            (index == -1)
                ? carrera.semestres[semestre].materias.push(clase)
                : carrera.semestres[semestre].materias[index] = clase;
        }
        saveDB('./public/json/mi-carrera.json', carrera);
        res.json({msg: 'La información de su clase se guardo correctamente'});
    } else {
        res.status(400).json({errors: ['El semestre ingresado es inválido']});
    }
};


module.exports = {
    clasesJsonGet,
    clasesJsonPut,
    clasesJsonDelete,
    carreraJsonGet,
    carreraJsonPut,
    carreraJsonDelete,
    clasesRespaldoJsonGet,
    carreraJsonPost,
    modificarDefinitivaSemestre,
    carreraJsonPutNueva
};