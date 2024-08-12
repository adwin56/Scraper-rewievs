const puppeteer = require("puppeteer");
const fs = require("fs");

async function runParser() {
  let allReviews = [];
  let platformRatings = {
    "Google Maps": [],
    "Яндекс Карты": [],
  };

  try {
    console.log("Запуск браузера...");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Парсинг отзывов с Google Maps
    console.log("Переход на страницу с отзывами на Google Maps...");
    await page.goto(
      "https://www.google.ru/maps/place/Стоматологическая+клиника+Даймонд-Клиника+Горьковская+Ӏ+имплантация+зубов,+виниры/@56.3109185,43.99761,17z/data=!4m8!3m7!1s0x4151d5ed4c477dbb:0xa76f684cc157f9b7!8m2!3d56.3110243!4d44.0001199!9m1!1b1!16s%2Fg%2F11bzrhpp3j?entry=ttu",
      { waitUntil: "networkidle2" }
    );

    const scrollableDivSelectorGoogle = ".m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde";
    console.log("Ожидание появления блока отзывов на Google Maps...");
    await page.waitForSelector(scrollableDivSelectorGoogle);

    console.log("Прокрутка блока на Google Maps...");
    await page.evaluate(async (selector) => {
      const scrollableDiv = document.querySelector(selector);
      if (!scrollableDiv) {
        console.error("Ошибка: прокручиваемый блок не найден!");
        return;
      }
      const scrollStep = 500;
      let lastHeight = scrollableDiv.scrollHeight;
      let attempt = 0;
      while (attempt < 20) {
        scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
        await new Promise((resolve) => setTimeout(resolve, 2000));
        let newHeight = scrollableDiv.scrollHeight;
        if (newHeight === lastHeight) {
          break;
        }
        lastHeight = newHeight;
        attempt++;
      }
    }, scrollableDivSelectorGoogle);

    console.log("Извлечение отзывов с Google Maps...");
    const googleReviews = await page.evaluate(() => {
      const reviewNodes = document.querySelectorAll(".jftiEf.fontBodyMedium");
      const reviewsArray = [];
      reviewNodes.forEach((node) => {
        const author = node.querySelector(".d4r55")
          ? node.querySelector(".d4r55").innerText
          : "Неизвестный автор";
        const rating = node.querySelector(".kvMYJc")
          ? parseFloat(
              node
                .querySelector(".kvMYJc")
                .getAttribute("aria-label")
                .split(" ")[0]
            )
          : "Без рейтинга";
        const date = node.querySelector(".rsqaWe")
          ? node.querySelector(".rsqaWe").innerText
          : "Дата отсутствует";
        const text = node.querySelector(".wiI7pd")
          ? node.querySelector(".wiI7pd").innerText
          : "Текст отсутствует";

        // Извлечение аватарок
        const avatarImg = node.querySelector(".NBa7we")
          ? node.querySelector(".NBa7we").getAttribute("src")
          : "Аватар отсутствует";

        reviewsArray.push({
          author: author,
          rating: rating,
          date: date,
          text: text,
          avatarUrl: avatarImg,
          platform: "Google Maps",
        });
      });
      return reviewsArray;
    });
    allReviews = allReviews.concat(googleReviews);
    platformRatings["Google Maps"] = googleReviews
      .map((r) => r.rating)
      .filter((r) => r !== "Без рейтинга");

    // Парсинг отзывов с Яндекс Карт
    console.log("Переход на страницу с отзывами на Яндекс Картах...");
    await page.goto(
      "https://yandex.ru/maps/org/daymond_klinik/164798670887/reviews/?indoorLevel=1&ll=49.123700%2C55.790012&z=16",
      { waitUntil: "networkidle2" }
    );

    console.log("Извлечение отзывов с Яндекс Картах...");
    const yandexReviews = await page.evaluate(() => {
      const reviewNodes = document.querySelectorAll(
        ".business-review-view__info"
      );
      const reviewsArray = [];
      reviewNodes.forEach((node) => {
        const author = node.querySelector(".business-review-view__author-name")
          ? node.querySelector(".business-review-view__author-name").innerText
          : "Неизвестный автор";
        const date = node.querySelector(".business-review-view__date")
          ? node.querySelector(".business-review-view__date").innerText
          : "Дата отсутствует";

        const fullStars = node.querySelectorAll(
          ".business-rating-badge-view__star._full"
        ).length;
        const emptyStars = node.querySelectorAll(
          ".business-rating-badge-view__star._empty"
        ).length;
        const rating = fullStars > 0 ? fullStars : "Без рейтинга";

        const reviewText = node.querySelector(
          ".business-review-view__body-text"
        )
          ? node.querySelector(".business-review-view__body-text").innerText
          : "Текст отсутствует";

        // Извлечение аватарок
        const avatarNode = node.querySelector(
          ".business-review-view__user-icon .user-icon-view__icon"
        );
        let avatarUrl = "Аватар отсутствует";

        if (avatarNode) {
          const style = avatarNode.getAttribute("style");
          if (style && style.includes("background-image")) {
            avatarUrl = style.match(/url\((.*?)\)/)[1];
          } else {
            avatarUrl = avatarNode.textContent || "Аватар отсутствует";
          }
        }

        reviewsArray.push({
          author: author,
          rating: rating,
          date: date,
          text: reviewText,
          avatarUrl: avatarUrl,
          platform: "Яндекс Карты",
        });
      });
      return reviewsArray;
    });
    allReviews = allReviews.concat(yandexReviews);
    platformRatings["Яндекс Карты"] = yandexReviews
      .map((r) => r.rating)
      .filter((r) => r !== "Без рейтинга");

    console.log("Количество отзывов с Google Maps:", googleReviews.length);
    console.log("Количество отзывов с Яндекс Карты:", yandexReviews.length);

    // Вычисление средней оценки для каждой платформы
    const averageRatings = {};
    for (const [platform, ratings] of Object.entries(platformRatings)) {
      const average =
        ratings.length > 0
          ? (
              ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            ).toFixed(1)
          : "Нет данных";
      averageRatings[platform] = average;
    }

    // Сохранение всех отзывов в один файл JSON
    console.log("Сохранение всех отзывов в файл JSON...");
    fs.writeFileSync(
      "reviews2.json",
      JSON.stringify(
        {
          reviews: allReviews,
          averageRatings: averageRatings,
        },
        null,
        2
      )
    );
    console.log("Все отзывы сохранены в файл reviews2.json");

    await browser.close();
    console.log("Браузер закрыт.");
  } catch (error) {
    console.error("Ошибка выполнения скрипта:", error);
  }
}

function startAtMidnight() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0); // Установить время на следующую полночь

  const timeUntilNextMidnight = nextMidnight - now;
  console.log(`Скрипт начнет работу через ${timeUntilNextMidnight / 1000} секунд.`);

  setTimeout(() => {
    runParser(); // Запускаем парсер
    setInterval(runParser, 24 * 60 * 60 * 1000); // Затем запускаем его каждые 24 часа
  }, timeUntilNextMidnight);
}

startAtMidnight();
