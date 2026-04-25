const BASE = 'https://apis.datos.gob.ar/georef/api'

export async function getProvincias() {
  const res = await fetch(`${BASE}/provincias?orden=nombre&campos=id,nombre&max=100`)
  const data = await res.json()
  return data.provincias
}

export async function getLocalidades(provinciaId, busqueda = '') {
  const params = new URLSearchParams({
    provincia: provinciaId,
    orden: 'nombre',
    campos: 'id,nombre,centroide',
    max: 100,
    ...(busqueda && { nombre: busqueda }),
  })
  const res = await fetch(`${BASE}/localidades?${params}`)
  const data = await res.json()
  return data.localidades
}

export async function buscarLocalidad(texto, provinciaId = '') {
  const params = new URLSearchParams({
    nombre: texto,
    campos: 'id,nombre,provincia',
    max: 8,
    ...(provinciaId && { provincia: provinciaId }),
  })
  const res = await fetch(`${BASE}/localidades?${params}`)
  const data = await res.json()
  return data.localidades
}
