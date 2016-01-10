require('prototypes');
var TelegramBot = require('node-telegram-bot-api');
var geocoder = require('geocoder');


var token = 'token';
var bot = new TelegramBot(token, {
  polling: true
});

var code = 'telegram';
var clients = new Array();
var textCaption = 'Мультитест Бот';
var textWelcome = 'Привет, я Мультитест Бот, помогаю найти интернет где угодно. Мне говорят адрес, я проверяю покрытие по базе провайдеров и показываю что там есть - тарифы, отзывы. Денег не беру, готов попробовать?';
var textError =
  'Упс, я не смог распознать адрес. Введи свой точный адрес, например "Киев, Николая Бажана просп., 32"';
var textResult =
  'Твой адрес %s? Тогда нажимай на ссылку и сравнивай тарифы';


bot.on('message', function(msg) {
  var chatId = msg.chat.id;

  if (!clients[msg.from.id]) {
    bot.sendMessage(chatId,
      textWelcome, {
        caption: textCaption
      });
    clients[msg.from.id] = true;
  } else {
    geocoder.geocode(msg.text, function(err, data) {
      if (data.status == 'ZERO_RESULTS') {
        bot.sendMessage(chatId,
          textError, {
            caption: textCaption
          });
      } else {
        try {
          address = data.results[0].formatted_address;
          lat = data.results[0].geometry.location.lat;
          lng = data.results[0].geometry.location.lng;
          countryCode = getCountryCode(data.results[0].address_components);
          site = getSiteUrl(countryCode);
          connPath = getConnTypePath(site);
          bot.sendMessage(chatId,
            textResult
            .format(address), {
              caption: textCaption
            });
          bot.sendMessage(chatId,

            '%s/coordinates/internet-%s/?lat=%s&lng=%s&address_text=%s&code=%s'.format(
              site, connPath, lat, lng, encodeURIComponent(address),
              code), {
              caption: textCaption
            });
        } catch (e) {
          bot.sendMessage(chatId,
            textError, {
              caption: textCaption
            });
        }
      }
    });
  }
});

function getCountryCode(arr) {
  for (var i = 0; i < arr.length; i++) {
    var type = arr[i].types[0];
    if(type == "country") {
      var countryCode = arr[i].short_name;
      return countryCode;
    } 
  }
}

function getSiteUrl(countryCode) {
  var site = "https://www.multitest.me";

  var countrySites = {
    UA: "http://www.multitest.ua",
    RU: "http://www.multitest.ru",
    PL: "http://www.multitest.net.pl",
    US: "http://www.multitest.co",
  };

  countryCode && countrySites[countryCode.toUpperCase()] && (site = countrySites[countryCode.toUpperCase()]);
  return site;
}

function getConnTypePath(site) {
  var paths = {
    "http://www.multitest.ua": "v-kvartiru",
    "http://www.multitest.ru": "v-kvartiru",
    "http://www.multitest.net.pl": "w-mieszkanie",
    "http://www.multitest.co": "apartment",
    "https://www.multitest.me": "apartment"
  },
  return paths[site];
}