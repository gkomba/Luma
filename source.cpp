#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>

// Wi-Fi
const char			*ssid = "gkomba";
const char			*password = "1234567890";

// IP Estático
IPAddress			local_IP(192, 168, 1, 100);
IPAddress			gateway(192, 168, 1, 1);
IPAddress			subnet(255, 255, 255, 0);

// Firebase URLs
const char			*firebaseURL_LED = "https://esp-api-10fa5-default-rtdb.firebaseio.com/led.json";
const char			*firebaseURL_CIRCUITO = "https://esp-api-10fa5-default-rtdb.firebaseio.com/circuito.json";

// Pinos
const int			relePim1 = 27; // LED
const int			relePim2 = 26; // Circuito
const int			pirPin = 14;
const int			ledTeste = 13;
const int			ldrPin = 34;

// PIR
bool				pirTriggered = false;
unsigned long		pirTriggerTime = 0;
const unsigned long	pirActiveDuration = 10000;

// LED manual com luz
bool				ledManualComSol = false;
unsigned long		tempoInicioLedManual = 0;
const unsigned long	duracaoLedComSol = 20000; // 20 segundos

// -----------------------------------------------------------------------------
// Função setup
void	setup(void)
{
	Serial.begin(115200);
	pinMode(relePim1, OUTPUT);
	pinMode(relePim2, OUTPUT);
	pinMode(pirPin, INPUT);
	pinMode(ledTeste, OUTPUT);
	digitalWrite(relePim1, HIGH);
	digitalWrite(relePim2, HIGH);
	if (!WiFi.config(local_IP, gateway, subnet))
	{
		Serial.println("Falha ao configurar IP estático");
	}
	WiFi.begin(ssid, password);
	Serial.print("Conectando-se ao WiFi");
	while (WiFi.status() != WL_CONNECTED)
	{
		delay(1000);
		Serial.print(".");
	}
	Serial.println();
	Serial.print("Conectado! IP: ");
	Serial.println(WiFi.localIP());
}

// -----------------------------------------------------------------------------
// Obter estado do Firebase
String	obterEstadoFirebase(const char *url)
{
	HTTPClient	http;
	int			httpCode;
	String		payload;

	http.begin(url);
	httpCode = http.GET();
	payload = "";
	if (httpCode == 200)
	{
		payload = http.getString();
		payload.trim();
		Serial.println("Estado recebido com sucesso.");
	}
	else
	{
		Serial.printf("Erro ao obter estado (%d)\n", httpCode);
	}
	http.end();
	return (payload);
}

// -----------------------------------------------------------------------------
// Atualizar estado no Firebase
void	atualizarEstadoFirebase(const String &novoEstado, const String &tipo,
		const String &acesso)
{
	HTTPClient	http;
	const char	*url = (tipo == "led") ? firebaseURL_LED : firebaseURL_CIRCUITO;
	String		jsonPayload;
	int			httpCode;

	http.begin(url);
	http.addHeader("Content-Type", "application/json");
	jsonPayload = "{\"status\":\"" + novoEstado + "\",\"type\":\"" + acesso
		+ "\"}";
	httpCode = http.PUT(jsonPayload);
	if (httpCode > 0)
		Serial.println("Estado atualizado com sucesso no Firebase.");
	else
		Serial.println("Erro ao atualizar estado no Firebase.");
	http.end();
}

// -----------------------------------------------------------------------------
// Controle baseado em LDR + Firebase
void	verificarLDR(String payload)
{
	int						ldrValue;
	DeserializationError	error;
	String					status;
	String					type;

	ldrValue = analogRead(ldrPin);
	StaticJsonDocument<100> doc;
	error = deserializeJson(doc, payload);
	if (error)
	{
		Serial.println("Erro ao ler JSON de estado.");
		return ;
	}
	status = doc["status"] | "";
	type = doc["type"] | "";
	Serial.printf("LDR: %d | status: %s | type: %s\n", ldrValue, status.c_str(),
		type.c_str());
	// Controle manual (root)
	if (type == "root")
	{
		if (status == "off")
		{
			digitalWrite(relePim1, HIGH);
			ledManualComSol = false;
			return ;
		}
		if (status == "on" && ldrValue > 100)
		{
			if (!ledManualComSol)
			{
				digitalWrite(relePim1, LOW);
				tempoInicioLedManual = millis();
				ledManualComSol = true;
				Serial.println("Ligando LED manualmente por 20s (ambiente claro).");
			}
			else if (millis() - tempoInicioLedManual >= duracaoLedComSol)
			{
				digitalWrite(relePim1, HIGH);
				atualizarEstadoFirebase("off", "led", "ldr");
				ledManualComSol = false;
				Serial.println("Desligando LED
					- tempo manual com luz expirado.");
			}
		}
		else if (status == "on" && ldrValue <= 100)
		{
			digitalWrite(relePim1, LOW);
			ledManualComSol = false;
		}
		return ;
	}
	// Controle automático (LDR)
	if (type == "ldr")
	{
		if (ldrValue <= 100 && status != "on")
		{
			digitalWrite(relePim1, LOW);
			atualizarEstadoFirebase("on", "led", "ldr");
		}
		else if (ldrValue > 100 && status != "off")
		{
			digitalWrite(relePim1, HIGH);
			atualizarEstadoFirebase("off", "led", "ldr");
		}
	}
}

// -----------------------------------------------------------------------------
// Controle de presença via PIR
void	verificarPresenca(void)
{
	if (digitalRead(pirPin) == HIGH)
	{
		pirTriggered = true;
		pirTriggerTime = millis();
		Serial.println("Movimento detectado pelo sensor PIR");
		digitalWrite(ledTeste, HIGH);
	}
	if (pirTriggered && (millis() - pirTriggerTime >= pirActiveDuration))
	{
		pirTriggered = false;
		digitalWrite(ledTeste, LOW);
		Serial.println("Tempo de ativação expirado (PIR)");
	}
}

// -----------------------------------------------------------------------------
// Controle do circuito (se quiser ativar)
void	LumaControlCircuit(String payload)
{
	DeserializationError	error;
	String					status;

	StaticJsonDocument<100> doc;
	error = deserializeJson(doc, payload);
	if (error)
		return ;
	status = doc["status"] | "";
	if (status == "on")
		digitalWrite(relePim2, LOW);
	else
		digitalWrite(relePim2, HIGH);
}

// -----------------------------------------------------------------------------
// Loop principal
void	loop(void)
{
	String	estadoLed;
	String	estadoCircuito;

	if (WiFi.status() == WL_CONNECTED)
	{
		estadoLed = obterEstadoFirebase(firebaseURL_LED);
		estadoCircuito = obterEstadoFirebase(firebaseURL_CIRCUITO);
		verificarLDR(estadoLed); // lógica com prioridade root
		// LumaControlCircuit(estadoCircuito); // habilite se quiser
		verificarPresenca();
	}
	else
	{
		Serial.println("Wi-Fi desconectado");
	}
}
