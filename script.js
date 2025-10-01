document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("Formulario");

    form.querySelectorAll(".campo").forEach(input => {
        if (input.tagName.toLowerCase() === "select" || input.type === "date") return;
        const errorMsg = document.createElement("div");
        errorMsg.classList.add("error");
        input.insertAdjacentElement("afterend", errorMsg);
    });

    const selectPais = document.getElementById("pais");
    fetch("https://restcountries.com/v3.1/all?fields=name")
        .then(res => res.json())
        .then(data => {
            selectPais.innerHTML = '<option value="">Seleccione un país</option>';
            data.sort((a,b) => a.name.common.localeCompare(b.name.common))
                .forEach(pais => {
                    const opt = document.createElement("option");
                    opt.value = pais.name.common;
                    opt.textContent = pais.name.common;
                    selectPais.appendChild(opt);
                });
        })
        .catch(() => {
            selectPais.innerHTML = '<option value="">Error al cargar países</option>';
        });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        let valido = true;

        const nombre = document.getElementById("nombre");
        const apellidos = document.getElementById("apellidos");
        const cedula = document.getElementById("cedula");
        const telefono = document.getElementById("telefono");
        const correo = document.getElementById("correo");

        if (nombre.value.trim() === "") { mostrarError(nombre, "El nombre es obligatorio."); valido = false; } 
        else { limpiarError(nombre); }

        if (apellidos.value.trim() === "") { mostrarError(apellidos, "Los apellidos son obligatorios."); valido = false; } 
        else { limpiarError(apellidos); }

        if (!/^[0-9]{10}$/.test(cedula.value.trim())) { mostrarError(cedula, "Numero de cedula inexistente."); valido = false; } 
        else { limpiarError(cedula); }

        if (!/^[0-9]{10}$/.test(telefono.value.trim())) { mostrarError(telefono, "Numero telefonico incompleto o excedente."); valido = false; } 
        else { limpiarError(telefono); }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value.trim())) { mostrarError(correo, "El correo no es válido."); valido = false; } 
        else { limpiarError(correo); }

        if (valido) {
            alert("Registro exitoso\n\n" +
                  "Nombre: " + nombre.value +
                  "\nApellidos: " + apellidos.value +
                  "\nCédula: " + cedula.value +
                  "\nFecha: " + document.getElementById("fecha").value +
                  "\nPaís: " + selectPais.value +
                  "\nGénero: " + document.getElementById("genero").value +
                  "\nTeléfono: " + telefono.value +
                  "\nCorreo: " + correo.value);
            form.reset();
            form.querySelectorAll(".campo").forEach(campo => campo.classList.remove("valid", "invalid"));
        }
    });

    function mostrarError(input, mensaje) {
        const errorDiv = input.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains("error")) {
            errorDiv.textContent = mensaje;
            errorDiv.style.display = "block";
        }
        input.classList.add("invalid");
        input.classList.remove("valid");
    }

    function limpiarError(input) {
        const errorDiv = input.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains("error")) {
            errorDiv.textContent = "";
            errorDiv.style.display = "none";
        }
        input.classList.remove("invalid");
        input.classList.add("valid");
    }
});
