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
const int			relePim1 = 27;
const int			relePim2 = 26;
const int			pirPin = 14;
const int			ledAssentos1 = 13;
const int			ledAssentos2 = 25;
const int			ldrPin = 34;
const int			sensorCorrente1 = 32;
const int			sensorCorrente2 = 33;
const int			sensorCorrente3 = 35;

// PIR
bool				pirTriggered = false;
unsigned long		pirTriggerTime = 0;
const unsigned long	pirActiveDuration = 10000;

// Controle de comando root
unsigned long		tempoComandoRoot = 0;
bool				comandoRootAtivo = false;
const unsigned long	duracaoComandoRoot = 20000;

// Task e controle de estado
TaskHandle_t		TaskLightHandle = NULL;
String				estadoLedGlobal = "";
bool				wifiConnected = false;

// Variáveis estáticas para controle dentro da função controlLight
static String		ultimoStatus = "";
static String		ultimoTipo = "";

// Variáveis para precisao de corrente
const int			OFFSET = 2047; // valor médio sem corrente
const int			MARGEM = 50;   // tolerância para considerar "sem corrente"

int					offsetL1;

int	calibraOffset(int pino)
{
	long	soma;

	soma = 0;
	for (int i = 0; i < 50; i++)
	{
		soma += analogRead(pino);
	}
	return (soma / 50);
}
// -----------------------------------------------------------------------------
void	setup(void)
{
	Serial.begin(115200);
	pinMode(relePim1, OUTPUT);
	pinMode(relePim2, OUTPUT);
	pinMode(pirPin, INPUT);
	pinMode(ledAssentos1, OUTPUT);
	pinMode(ledAssentos1, OUTPUT);
	pinMode(sensorCorrente1, INPUT);
	pinMode(sensorCorrente2, INPUT);
	pinMode(sensorCorrente3, INPUT);
	digitalWrite(relePim1, HIGH);
	digitalWrite(relePim2, HIGH);
	offsetL1 = calibraOffset(sensorCorrente1);
	if (!WiFi.config(local_IP, gateway, subnet))
		Serial.println("Falha ao configurar IP estático");
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
	xTaskCreatePinnedToCore(TaskControlLight, "TaskControlLight", 4096, NULL, 1,
		&TaskLightHandle, 0);
}

// -----------------------------------------------------------------------------
String	obterEstadoFirebase(const char *url)
{
	HTTPClient	http;
	String		payload;
	int			httpCode;

	payload = "";
	http.begin(url);
	httpCode = http.GET();
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
void	atualizarEstadoFirebase(const String &novoEstado, const String &tipo,
		const String &acesso)
{
	HTTPClient	http;
	const char	*url = (tipo == "led") ? firebaseURL_LED : firebaseURL_CIRCUITO;
	String		jsonPayload;
	int			httpCode;

	jsonPayload = "{\"status\":\"" + novoEstado + "\",\"type\":\"" + acesso
		+ "\"}";
	http.begin(url);
	http.addHeader("Content-Type", "application/json");
	httpCode = http.PUT(jsonPayload);
	if (httpCode > 0)
		Serial.println("Estado atualizado com sucesso no Firebase.");
	else
		Serial.println("Erro ao atualizar estado no Firebase.");
	http.end();
}

// -----------------------------------------------------------------------------
void	controlLight(String payload, String connect)
{
	int						ldrValue;
	DeserializationError	error;
	String					status;
	String					type;
	unsigned long			tempoPassado;

	ldrValue = analogRead(ldrPin);
	if (connect == "offline")
	{
		if (ldrValue <= 100)
			digitalWrite(relePim1, LOW);
		else
			digitalWrite(relePim1, HIGH);
		return ;
	}
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
	// Se comando root foi recebido e é diferente do último comando root,
		iniciar timer
	if (type == "root" && (status != ultimoStatus || type != ultimoTipo))
	{
		comandoRootAtivo = true;
		tempoComandoRoot = millis();
		ultimoStatus = status;
		ultimoTipo = type;
		if (status == "on")
		{
			digitalWrite(relePim1, LOW);
			Serial.println("ROOT: Ligando luz manualmente por 50s.");
		}
		else if (status == "off")
		{
			digitalWrite(relePim1, HIGH);
			Serial.println("ROOT: Desligando luz manualmente por 50s.");
		}
		return ; // Para não executar mais código até o tempo expirar
	}
	// Durante o tempo do root, manter decisão manual e ignorar LDR
	if (comandoRootAtivo)
	{
		tempoPassado = millis() - tempoComandoRoot;
		Serial.printf("Tempo desde root: %lu ms\n", tempoPassado);
		if (tempoPassado < duracaoComandoRoot)
		{
			Serial.println("Aguardando fim dos 50s do comando root...");
			return ;
		}
		else
		{
			comandoRootAtivo = false;
			Serial.println("Tempo do comando root expirou.");
		}
	}
	// CONTROLE LDR - após root ou em uso normal
	if (ldrValue <= 100 && ultimoStatus != "on")
	{
		digitalWrite(relePim1, LOW);
		atualizarEstadoFirebase("on", "led", "ldr");
		ultimoStatus = "on";
		Serial.println("LDR: escuro -> Ligando");
	}
	else if (ldrValue > 100 && ultimoStatus != "off")
	{
		digitalWrite(relePim1, HIGH);
		atualizarEstadoFirebase("off", "led", "ldr");
		ultimoStatus = "off";
		Serial.println("LDR: claro -> Desligando");
	}
}

// -----------------------------------------------------------------------------
void	verificarPresenca(void)
{
	if (digitalRead(pirPin) == HIGH)
	{
		pirTriggered = true;
		pirTriggerTime = millis();
		Serial.println("Movimento detectado pelo sensor PIR");
		digitalWrite(ledAssentos1, HIGH);
	}
	if (pirTriggered && (millis() - pirTriggerTime >= pirActiveDuration))
	{
		pirTriggered = false;
		digitalWrite(ledAssentos1, LOW);
		Serial.println("Tempo de ativação expirado (PIR)");
	}
}
//-----------------------------------------------------------------------------

void	verificarFalhas(void)
{
	int	leitura;

	leitura = analogRead(sensorCorrente1);
	int corrente = leitura - offsetL1; // Valor relativo ao offset
	Serial.print("Valor Corrente: ");
	Serial.println(corrente);
}

// -----------------------------------------------------------------------------
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
void	loop(void)
{
	String	estadoCircuito;

	if (WiFi.status() == WL_CONNECTED)
	{
		wifiConnected = true;
		estadoLedGlobal = obterEstadoFirebase(firebaseURL_LED);
		estadoCircuito = obterEstadoFirebase(firebaseURL_CIRCUITO);
		LumaControlCircuit(estadoCircuito);
	}
	else
	{
		wifiConnected = false;
		// Serial.println("Wi-Fi desconectado");
	}
	verificarPresenca();
	verificarFalhas();
	delay(100);
}

// -----------------------------------------------------------------------------
void	TaskControlLight(void *parameter)
{
	for (;;)
	{
		if (wifiConnected)
			controlLight(estadoLedGlobal, "online");
		else
			controlLight("", "offline");

		vTaskDelay(200 / portTICK_PERIOD_MS);
	}
}