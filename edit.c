#include <HTTPClient.h>
#include <WiFi.h>

// Wi-Fi
const char			*ssid = "gkomba";
const char			*password = "1234567890";

// IP Estático
IPAddress			local_IP(192, 168, 1, 100);
IPAddress			gateway(192, 168, 1, 1);
IPAddress			subnet(255, 255, 255, 0);

// Firebase Realtime Database
const char			*firebaseURL_LED = "https://esp-api-10fa5-default-rtdb.firebaseio.com/led.json";
const char			*firebaseURL_CIRCUITO = "https://esp-api-10fa5-default-rtdb.firebaseio.com/circuito.json";

// Pinos
const int			relePim1 = 27; // Controle do LED
const int			relePim2 = 26; // Controle do circuito
const int			pirPin = 14;
const int     ledTeste = 13;
const int			ldrPin = 34;

// Controle PIR
bool				pirTriggered = false;
unsigned long		pirTriggerTime = 0;
const unsigned long	pirActiveDuration = 10000;

// -----------------------------------------------------------------------------

void	setup(void)
{
	Serial.begin(115200);
	pinMode(relePim1, OUTPUT);
	pinMode(relePim2, OUTPUT);
  pinMode(ledTeste, OUTPUT);
	digitalWrite(relePim1, HIGH); // Relé desligado
	digitalWrite(relePim2, HIGH); // Relé desligado
	pinMode(pirPin, INPUT);
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
}

// -----------------------------------------------------------------------------

String	obterEstadoFirebase(String tipo)
{
	HTTPClient	http;
	int			httpCode;
	String		payload;

	if (tipo == "led")
		http.begin(firebaseURL_LED);
	else if (tipo == "circuito")
		http.begin(firebaseURL_CIRCUITO);
	else
		return ("");
	httpCode = http.GET();
	payload = "";
	if (httpCode == 200)
	{
		payload = http.getString();
		payload.trim();
		payload.replace("\"", "");
		Serial.println("sucesso");
	}
	else
	{
		Serial.print("Erro ao obter estado do Firebase (");
		Serial.print(tipo);
		Serial.print("): ");
		Serial.println(httpCode);
	}
	http.end();
	return (payload);
}

// -----------------------------------------------------------------------------

void	atualizarEstadoFirebase(String novoEstado, String tipo)
{
	HTTPClient	http;
	String		jsonPayload;
	int			httpCode;

	if (tipo == "led")
		http.begin(firebaseURL_LED);
	else if (tipo == "circuito")
		http.begin(firebaseURL_CIRCUITO);
	else
		return ;
	http.addHeader("Content-Type", "application/json");
	jsonPayload = "\"" + novoEstado + "\"";
	httpCode = http.PUT(jsonPayload);
	if (httpCode > 0)
		Serial.println("Estado atualizado com sucesso no Firebase.");
	else
		Serial.println("Erro ao atualizar estado no Firebase.");
	http.end();
}

// -----------------------------------------------------------------------------

void	verificarPresenca(void)
{
	if (digitalRead(pirPin) == HIGH)
	{
		pirTriggered = true;
		pirTriggerTime = millis();
		Serial.println("Movimento detectado pelo sensor PIR");
		digitalWrite(ledTeste, HIGH); // Ativa led do circuito
	}
	if (pirTriggered && (millis() - pirTriggerTime >= pirActiveDuration))
	{
		pirTriggered = false;
		digitalWrite(ledTeste, LOW); // Desliga led
		Serial.println("Tempo de ativação expirado (PIR)");
	}
}

// -----------------------------------------------------------------------------

void	verificarLDR(String estadoAtual)
{
	int	sinal;
  int ini;
  int fim;
  String status;
  String type;

  ini = estadoAtual.indexOf("status:") + 7;
  fim = estadoAtual.indexOf(",", ini);
  status = estadoAtual.substring(ini, fim);
  ini = estadoAtual.indexOf("type:") + 5;
  fim = estadoAtual.indexOf("}", ini);
  type = estadoAtual.substring(ini, fim);
  Serial.println(status);
  Serial.println(type);
	sinal = analogRead(ldrPin);
	Serial.print("LDR: ");
	Serial.println(sinal);
  // if (sinal <= 100)
  // {
  //   digitalWrite(relePim1, LOW);
  //   atualizarEstadoFirebase("on", "led", "ldr");
  // }
  // else if (sinal > 100)
  // {
  //   digitalWrite(relePim1, HIGH);
  //   atualizarEstadoFirebase("off", "led", "ldr");
  // }
}

// -----------------------------------------------------------------------------

void	LumaControlLight(String estado)
{
  int ini;
  int fim;
  String status;

  ini = estado.indexOf("status:") + 7;
  fim = estado.indexOf(",", ini);
  status = estado.substring(ini, fim);
  Serial.println(status);
	if (status == "on")
		digitalWrite(relePim1, LOW);
	else
		digitalWrite(relePim1, HIGH);
}

void	LumaControlCircuit(String estado)
{
	int		ini;
	int		fim;
	String	status;

	ini = estado.indexOf("status:") + 7;
	fim = estado.indexOf("}", ini);
	status = estado.substring(ini, fim);
	if (status == "on")
		digitalWrite(relePim2, LOW);
	else
		digitalWrite(relePim2, HIGH);
}

// -----------------------------------------------------------------------------

void	loop(void)
{
	String	estadoLed;
	String	estadoCircuito;

	if (WiFi.status() == WL_CONNECTED)
	{
		estadoLed = obterEstadoFirebase("led");
    Serial.println(estadoLed);
		estadoCircuito = obterEstadoFirebase("circuito");
		LumaControlLight(estadoLed);
		// LumaControlCircuit(estadoCircuito);
		verificarLDR(estadoLed);
		verificarPresenca();
	}
	else
	{
		Serial.println("Wi-Fi desconectado");
	}
}
