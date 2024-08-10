const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    try {
        console.log('Запуск браузера...');
        const browser = await puppeteer.launch({ headless: false }); // запуск браузера в видимом режиме
        const page = await browser.newPage();

        // Переход на страницу с отзывами
        console.log('Переход на страницу с отзывами...');
        await page.goto('https://www.google.ru/maps/place/Стоматологическая+клиника+Даймонд-Клиника+Горьковская+Ӏ+имплантация+зубов,+виниры/@56.3109185,43.99761,17z/data=!4m8!3m7!1s0x4151d5ed4c477dbb:0xa76f684cc157f9b7!8m2!3d56.3110243!4d44.0001199!9m1!1b1!16s%2Fg%2F11bzrhpp3j?entry=ttu', { waitUntil: 'networkidle2' });

        // Ждем появления блока отзывов
        const scrollableDivSelector = '.m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde'; // Убедитесь, что этот селектор корректен
        console.log('Ожидание появления блока отзывов...');
        await page.waitForSelector(scrollableDivSelector);

        console.log('Проверка и прокрутка блока...');
        // Прокрутка конкретного блока для загрузки всех отзывов
        await page.evaluate(async (selector) => {
            const scrollableDiv = document.querySelector(selector);

            if (!scrollableDiv) {
                console.error('Ошибка: прокручиваемый блок не найден!');
                return;
            }

            console.log('Блок найден. Начинается прокрутка...');
            const scrollStep = 250;
            let lastHeight = scrollableDiv.scrollHeight;
            let attempt = 0;
            while (attempt < 10) { // Увеличено количество попыток
                scrollableDiv.scrollTop = scrollableDiv.scrollHeight; // Прокрутка до низа
                console.log(`Попытка ${attempt + 1}: высота до ${lastHeight}, высота после ${scrollableDiv.scrollHeight}`);

                await new Promise(resolve => setTimeout(resolve, 2000)); // Подождем 2 секунды, чтобы новые элементы загрузились

                let newHeight = scrollableDiv.scrollHeight;
                console.log(`Высота после ожидания ${newHeight}`);

                if (newHeight === lastHeight) {
                    console.log('Прокрутка завершена, новых отзывов не загружено.');
                    break; // Выходим из цикла, если больше ничего не загрузилось
                }
                lastHeight = newHeight;
                attempt++;
            }
        }, scrollableDivSelector);

        console.log('Извлечение отзывов...');
        // Извлечение отзывов
        const reviews = await page.evaluate(() => {
            const reviewNodes = document.querySelectorAll('.jftiEf.fontBodyMedium');

            if (reviewNodes.length === 0) {
                console.warn('Предупреждение: Отзывы не найдены!');
            }

            const reviewsArray = [];
            reviewNodes.forEach(node => {
                const author = node.querySelector('.d4r55') ? node.querySelector('.d4r55').innerText : 'Неизвестный автор';
                const rating = node.querySelector('.kvMYJc') ? node.querySelector('.kvMYJc').getAttribute('aria-label').split(' ')[0] : 'Без рейтинга';
                const date = node.querySelector('.rsqaWe') ? node.querySelector('.rsqaWe').innerText : 'Дата отсутствует';
                const text = node.querySelector('.wiI7pd') ? node.querySelector('.wiI7pd').innerText : 'Текст отсутствует';

                reviewsArray.push({
                    author: author,
                    rating: rating,
                    date: date,
                    text: text
                });
            });

            console.log(`${reviewsArray.length} отзывов извлечено.`);
            return reviewsArray;
        });

        console.log('Сохранение отзывов в файл JSON...');
        // Сохранение отзывов в файл JSON
        fs.writeFileSync('reviews.json', JSON.stringify(reviews, null, 2));

        console.log('Отзывы сохранены в файл reviews.json');

        await browser.close();
        console.log('Браузер закрыт.');
    } catch (error) {
        console.error('Ошибка выполнения скрипта:', error);
    }
})();
