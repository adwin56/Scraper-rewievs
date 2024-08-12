<?php
while (true) {
    // Получаем текущее время
    $currentHour = (int)date('H');
    $currentMinute = (int)date('i');

    // Проверяем, наступила ли полночь
    if ($currentHour === 0 && $currentMinute === 0) {
        // Ваш код для парсинга 2ГИС
        $url = 'https://2gis.ru/n_novgorod/inside/2674647933966364/firm/70000001021080960/tab/reviews?m=43.999939%2C56.311007%2F16%2Fp%2F0.3';
        $html = file_get_contents($url);

        if ($html === FALSE) {
            echo json_encode(['error' => 'Не удалось загрузить страницу']);
            exit;
        }

        $dom = new DOMDocument();
        @$dom->loadHTML($html);
        $xpath = new DOMXPath($dom);

        $reviews = [];
        $totalRating = 0;
        $reviewCount = 0;
        $reviewNodes = $xpath->query("//div[contains(@class, '_11gvyqv')]");

        foreach ($reviewNodes as $node) {
            $author = $xpath->query(".//span[@class='_16s5yj36']", $node)->item(0)->textContent ?? 'Неизвестный автор';
            $date = $xpath->query(".//div[@class='_4mwq3d']", $node)->item(0)->textContent ?? 'Дата отсутствует';
            $rating = $xpath->query(".//div[@class='_1fkin5c']/span", $node)->length ?? 0;
            $reviewText = $xpath->query(".//a[@class='_ayej9u3']", $node)->item(0)->textContent ?? 'Текст отсутствует';

            $avatarUrl = 'Аватар отсутствует';
            $avatarNodeImage = $xpath->query(".//div[contains(@class, '_1dk5lq4')]", $node)->item(0);
            $avatarNodeText = $xpath->query(".//div[contains(@class, '_10v2ue3')]", $node)->item(0);

            if ($avatarNodeImage) {
                $style = $avatarNodeImage->getAttribute('style');
                if (preg_match('/background-image:url\(([^)]+)\)/', $style, $matches)) {
                    $avatarUrl = $matches[1];
                }
            } elseif ($avatarNodeText) {
                $avatarUrl = $avatarNodeText->textContent;
            }

            $totalRating += $rating;
            $reviewCount++;

            $reviews[] = [
                'author' => trim($author),
                'date' => trim($date),
                'rating' => $rating,
                'reviewText' => trim($reviewText),
                'avatarUrl' => $avatarUrl,
                'platform' => '2ГИС'
            ];
        }

        $averageRating = $reviewCount > 0 ? $totalRating / $reviewCount : 0;
        $jsonData = [
            'reviews' => $reviews,
            'averageRating2GIS' => round($averageRating, 1)
        ];

        file_put_contents('parse_2GIS.json', json_encode($jsonData, JSON_PRETTY_PRINT));

        echo json_encode($jsonData);
        
        // Задержка на одну минуту, чтобы избежать повторного запуска скрипта в ту же минуту
        sleep(60);
    }

    // Задержка на 30 секунд перед повторной проверкой времени
    sleep(30);
}
?>
