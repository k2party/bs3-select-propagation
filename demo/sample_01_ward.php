<?php
$q = isset($_GET['q'])? $_GET['q']:'';
error_log('query[' . $q . ']');

$file = file_get_contents("sample_01.csv");

$datas = [];
foreach(explode("\n", $file) as $line) {
    $csv = str_getcsv($line, "\t");
    $csv = array_combine(['pref_code', 'pref_name', 'city_code', 'city_name', 'ward_name'], $csv);
    if($csv['city_code'] == $q || $q == '*') {
        if(!in_array($csv['ward_name'], $datas)) {
            $datas[] = $csv['ward_name'];
        }
    }
}

$result = [
    'result' => 'SUCCESS',
    'data' => $datas,
];

$json = json_encode($result, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);

error_log('result => ' . $json);

echo $json;
?>