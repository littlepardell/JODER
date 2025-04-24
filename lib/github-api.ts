// Utilidades para interactuar con la API de GitHub

/**
 * Función para obtener información del usuario de GitHub
 * @param username Nombre de usuario de GitHub
 * @returns Datos del usuario
 */
export async function getGitHubUserInfo(username: string) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `token ${process.env.GITHUB_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Error al obtener información de GitHub: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error en la API de GitHub:", error)
    throw error
  }
}

/**
 * Función para obtener los repositorios de un usuario de GitHub
 * @param username Nombre de usuario de GitHub
 * @returns Lista de repositorios
 */
export async function getUserRepositories(username: string) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}/repos`, {
      headers: {
        Authorization: `token ${process.env.GITHUB_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Error al obtener repositorios: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error en la API de GitHub:", error)
    throw error
  }
}

/**
 * Función para verificar si un usuario existe en GitHub
 * @param username Nombre de usuario de GitHub
 * @returns Booleano indicando si el usuario existe
 */
export async function checkGitHubUser(username: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `token ${process.env.GITHUB_KEY}`,
      },
    })

    return response.ok
  } catch (error) {
    console.error("Error verificando usuario de GitHub:", error)
    return false
  }
}
