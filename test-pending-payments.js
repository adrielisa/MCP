async function testPendingPayments() {
    try {
        // Crear una clase temporal para probar
        class TestUpnifyAuth {
            constructor() {
                this.tokenCache = {};
                this.baseUrl = 'https://api.upnify.com';
            }

            getCacheKey(email, password) {
                return `${email}_${Buffer.from(password).toString('base64').substring(0, 10)}`;
            }

            async getTokenAndUserInfo(email, password) {
                const cacheKey = this.getCacheKey(email, password);
                
                const cached = this.tokenCache[cacheKey];
                if (cached && new Date() < cached.expiry) {
                    return { token: cached.token, userInfo: cached.userInfo };
                }

                try {
                    const response = await fetch(`${this.baseUrl}/v4/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            usuario: email,
                            contrasenia: password
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Error en login: ${response.status} ${response.statusText}`);
                    }

                    const data = await response.json();
                    
                    if (!data || data.length === 0) {
                        throw new Error('Credenciales inválidas o respuesta inesperada del servidor');
                    }

                    const userInfo = data[0];
                    if (!userInfo.tkSesion) {
                        throw new Error('Token de sesión no recibido');
                    }

                    this.tokenCache[cacheKey] = {
                        token: userInfo.tkSesion,
                        expiry: new Date(userInfo.expiracion),
                        userInfo: userInfo
                    };

                    return { token: userInfo.tkSesion, userInfo };
                } catch (error) {
                    throw new Error(`Error al autenticarse con Upnify: ${error instanceof Error ? error.message : error}`);
                }
            }

            async getPendingPayments(email, password, reportParams) {
                const { token, userInfo } = await this.getTokenAndUserInfo(email, password);
                
                try {
                    const queryParams = new URLSearchParams({
                        agrupacion: reportParams.agrupacion.toString(),
                        periodicidad: reportParams.periodicidad.toString()
                    });

                    const response = await fetch(`${this.baseUrl}/v4/reportesnv/clientes/cobrospendientes?${queryParams}`, {
                        method: 'GET',
                        headers: {
                            'token': token,
                            'Content-Type': 'application/json',
                            'User-Agent': 'UpnifyMCP/1.0'
                        }
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Parámetros enviados:', reportParams);
                        console.error('Token usado:', token);
                        console.error('Respuesta del servidor:', errorText);
                        throw new Error(`Error al obtener cobros pendientes: ${response.status} ${response.statusText}. ${errorText}`);
                    }

                    const result = await response.json();
                    return {
                        success: true,
                        message: 'Cobros pendientes obtenidos exitosamente',
                        data: result,
                        parameters: reportParams,
                        total: result.length || 0,
                        tkEmpresa: userInfo.tkEmpresa
                    };
                } catch (error) {
                    throw new Error(`Error al obtener cobros pendientes de Upnify: ${error instanceof Error ? error.message : error}`);
                }
            }
        }

        const upnifyAuth = new TestUpnifyAuth();
        
        const result = await upnifyAuth.getPendingPayments(
            'adriel.upnify@gmail.com',
            'Adrielisa#67',
            {
                agrupacion: 1,  // Por ejecutivo
                periodicidad: 4 // Mensual
            }
        );

        console.log('=== PAGOS PENDIENTES EN UPNIFY ===');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.data && Array.isArray(result.data)) {
            console.log(`\nTotal de registros encontrados: ${result.data.length}`);
            
            if (result.data.length > 0) {
                console.log('\n=== RESUMEN DE PAGOS PENDIENTES ===');
                result.data.forEach((pago, index) => {
                    console.log(`${index + 1}. Cliente: ${pago.cliente || 'N/A'}`);
                    console.log(`   Monto: ${pago.monto || 'N/A'}`);
                    console.log(`   Fecha: ${pago.fecha || 'N/A'}`);
                    console.log('   ---');
                });
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testPendingPayments();
