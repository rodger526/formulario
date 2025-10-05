class ValidadorFormulario {
    constructor(idFormulario) {
        this.formulario = document.getElementById(idFormulario);
        this.campos = this.formulario.querySelectorAll('.campo');
        this.elementosError = new Map();
        this.estaEnviando = false;

        this.REGLAS_VALIDACION = {
            nombre: {
                requerido: true,
                mensaje: 'El nombre es obligatorio.',
                validar: (valor) => valor !== ''
            },
            apellidos: {
                requerido: true,
                mensaje: 'Los apellidos son obligatorios.',
                validar: (valor) => valor !== ''
            },
            cedula: {
                requerido: true,
                mensaje: 'Numero de cedula inexistente.',
                validar: (valor) => /^[0-9]{10}$/.test(valor)
            },
            fecha: {
                requerido: true,
                mensaje: 'La fecha de nacimiento es obligatoria y debe ser válida (mayor de 18 años).',
                validar: (valor) => {
                    const fechaNacimiento = new Date(valor);
                    const hoy = new Date();
                    const fechaMinimaEdad = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
                    return fechaNacimiento <= hoy && fechaNacimiento <= fechaMinimaEdad;
                }
            },
            pais: {
                requerido: true,
                mensaje: 'Seleccione un país.',
                validar: (valor) => valor !== ''
            },
            genero: {
                requerido: true,
                mensaje: 'Seleccione un género.',
                validar: (valor) => valor !== ''
            },
            telefono: {
                requerido: true,
                mensaje: 'Numero telefonico incompleto o excedente.',
                validar: (valor) => /^[0-9]{10}$/.test(valor)
            },
            correo: {
                requerido: true,
                mensaje: 'El correo no es válido.',
                validar: (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
            }
        };

        this.inicializar();
    }

    inicializar() {
        this.crearElementosError();
        this.cargarPaises();
        this.agregarEscuchadores();
        this.actualizarEstadoBoton();
    }

    crearElementosError() {
        this.campos.forEach(campo => {
            if (campo.tagName.toLowerCase() === 'select' || campo.type === 'date') return;

            const divError = document.createElement('div');
            divError.classList.add('error');
            divError.setAttribute('role', 'alert');
            divError.setAttribute('aria-live', 'polite');
            campo.insertAdjacentElement('afterend', divError);
            this.elementosError.set(campo.id, divError);
        });
    }

    async cargarPaises() {
        const selectPais = document.getElementById('pais');
        selectPais.disabled = true;
        selectPais.innerHTML = '<option value="">Cargando países...</option>';

        try {
            const controlador = new AbortController();
            const idTiempo = setTimeout(() => controlador.abort(), 5000);

            const respuesta = await fetch('https://restcountries.com/v3.1/all?fields=name', {
                signal: controlador.signal
            });

            clearTimeout(idTiempo);

            if (!respuesta.ok) {
                throw new Error(`HTTP ${respuesta.status}: ${respuesta.statusText}`);
            }

            const datos = await respuesta.json();

            const paisesOrdenados = datos.sort((a, b) => 
                a.name.common.localeCompare(b.name.common)
            );

            selectPais.innerHTML = '<option value="">Seleccione un país</option>';
            paisesOrdenados.forEach(pais => {
                const opcion = document.createElement('option');
                opcion.value = pais.name.common;
                opcion.textContent = pais.name.common;
                selectPais.appendChild(opcion);
            });

        } catch (error) {
            console.error('Error cargando países:', error);
            selectPais.innerHTML = '<option value="">Error al cargar países</option>';
        } finally {
            selectPais.disabled = false;
            this.actualizarEstadoBoton();
        }
    }

    agregarEscuchadores() {
        this.formulario.addEventListener('submit', (e) => this.manejarEnvio(e));

        this.formulario.addEventListener('blur', (e) => {
            if (e.target.classList.contains('campo')) {
                this.validarCampo(e.target);
                this.actualizarEstadoBoton();
            }
        }, true);

        this.formulario.addEventListener('focus', (e) => {
            if (e.target.classList.contains('campo')) {
                this.limpiarError(e.target);
            }
        }, true);

        this.formulario.addEventListener('input', (e) => {
            if (e.target.classList.contains('campo')) {
                this.validarCampo(e.target);
                this.actualizarEstadoBoton();
            }
        }, true);

        this.formulario.addEventListener('change', (e) => {
            if (e.target.classList.contains('campo')) {
                this.validarCampo(e.target);
                this.actualizarEstadoBoton();
            }
        }, true);

        const campoCedula = document.getElementById('cedula');
        if (campoCedula) {
            campoCedula.addEventListener('input', (e) => this.formatearCedula(e.target));
        }
    }

    formatearCedula(campo) {
        const posicionCursor = campo.selectionStart;
        const longitudOriginal = campo.value.length;

        let valorLimpio = campo.value.replace(/\D/g, '');
        valorLimpio = valorLimpio.slice(0, 10);

        let valorFormateado = valorLimpio;
        if (valorLimpio.length === 10) {
            valorFormateado = valorLimpio.slice(0, 9) + '-' + valorLimpio.slice(9);
        }

        campo.value = valorFormateado;

        let nuevaPosicionCursor = posicionCursor;
        if (valorFormateado.length > longitudOriginal && valorLimpio.length === 10) {
            nuevaPosicionCursor = Math.min(posicionCursor + 1, valorFormateado.length);
        } else {
            nuevaPosicionCursor = Math.min(posicionCursor, valorFormateado.length);
        }

        campo.setSelectionRange(nuevaPosicionCursor, nuevaPosicionCursor);

        this.validarCampo(campo);
        this.actualizarEstadoBoton();
    }

    validarCampo(campo) {
        const idCampo = campo.id;
        const regla = this.REGLAS_VALIDACION[idCampo];
        if (!regla) return true;

        let valor = campo.value;
        if (idCampo === 'cedula') {
            valor = valor.replace(/-/g, '').trim();
        } else if (campo.type !== 'date' && campo.tagName.toLowerCase() !== 'select') {
            valor = valor.trim();
        }

        const esValido = regla.validar(valor);

        if (esValido) {
            this.limpiarError(campo);
        } else {
            this.mostrarError(campo, regla.mensaje);
        }

        return esValido;
    }

    actualizarEstadoBoton() {
        const boton = this.formulario.querySelector('.boton');
        const todosValidos = Object.keys(this.REGLAS_VALIDACION).every(idCampo => {
            const campo = document.getElementById(idCampo);
            return this.validarCampo(campo);
        });
        boton.disabled = !todosValidos;
    }

    manejarEnvio(e) {
        e.preventDefault();
        if (this.estaEnviando) return;

        this.estaEnviando = true;
        const boton = this.formulario.querySelector('.boton');
        boton.disabled = true;
        boton.textContent = 'Procesando...';

        let formularioValido = true;

        Object.keys(this.REGLAS_VALIDACION).forEach(idCampo => {
            const campo = document.getElementById(idCampo);
            if (!this.validarCampo(campo)) {
                formularioValido = false;
            }
        });

        if (formularioValido) {
            const datos = this.obtenerDatosFormulario();
            this.mostrarExito(datos);
            this.reiniciarFormulario();
        }

        this.estaEnviando = false;
        boton.disabled = false;
        boton.textContent = 'Registrarse';
        this.actualizarEstadoBoton();
    }

    obtenerDatosFormulario() {
        const datos = {};
        Object.keys(this.REGLAS_VALIDACION).forEach(idCampo => {
            const campo = document.getElementById(idCampo);
            let valor = campo.value;
            if (idCampo === 'cedula') {
                valor = valor.replace(/-/g, '').trim();
            } else if (campo.type !== 'date' && campo.tagName.toLowerCase() !== 'select') {
                valor = valor.trim();
            }
            datos[idCampo] = valor;
        });
        return datos;
    }

    mostrarExito(datos) {
        const mensaje = `Registro exitoso\n\n` +
                       `Nombre: ${datos.nombre}\n` +
                       `Apellidos: ${datos.apellidos}\n` +
                       `Cédula: ${datos.cedula}\n` +
                       `Fecha: ${datos.fecha}\n` +
                       `País: ${datos.pais}\n` +
                       `Género: ${datos.genero}\n` +
                       `Teléfono: ${datos.telefono}\n` +
                       `Correo: ${datos.correo}`;
        
        alert(mensaje);
        console.log('Registro exitoso:', datos);
    }

    reiniciarFormulario() {
        this.formulario.reset();
        this.campos.forEach(campo => {
            campo.classList.remove('valid', 'invalid');
            this.limpiarError(campo);
        });
        this.actualizarEstadoBoton();
    }

    mostrarError(campo, mensaje) {
        const divError = this.elementosError.get(campo.id) || campo.nextElementSibling;
        if (divError && divError.classList.contains('error')) {
            divError.textContent = mensaje;
            divError.style.display = 'block';
        }

        campo.classList.add('invalid');
        campo.classList.remove('valid');
        campo.setAttribute('aria-invalid', 'true');
        if (divError) {
            campo.setAttribute('aria-describedby', divError.id || `${campo.id}-error`);
            divError.id = divError.id || `${campo.id}-error`;
        }
    }

    limpiarError(campo) {
        const divError = this.elementosError.get(campo.id) || campo.nextElementSibling;
        if (divError && divError.classList.contains('error')) {
            divError.textContent = '';
            divError.style.display = 'none';
        }

        campo.classList.remove('invalid');
        campo.classList.add('valid');
        campo.setAttribute('aria-invalid', 'false');
        campo.removeAttribute('aria-describedby');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ValidadorFormulario('Formulario');
});
