export async function auth( username, password ){
    try{
        const promesa = await fetch('https://dummyjson.com/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username, password
            }),
        })
        if ( !promesa.ok ){
            throw new Error('Error en la autenticación')
        }
        const response = await promesa.json()
        return response
    }catch(e){
        console.log(e)
    }
}

export async function getUserData( accessToken ){
    try{
        const promesa = await fetch('https://dummyjson.com/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`, // Pass JWT via Authorization header
            }
        })
        if ( !promesa.ok ){
            throw new Error('Error al obtener los datos del usuario')
        }
        const response = await promesa.json()
        return response
    }catch(e){
        console.log(e)
    }
}