// ==UserScript==
// @name         浦发账单导出为excel工具
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://ebill.spdbccc.com.cn/cloudbank-portal/billDetailController/*
// @grant        none
// @require https://cdn.bootcss.com/PapaParse/4.6.1/papaparse.js
// @require https://cdn.bootcss.com/echarts/4.2.0-rc.1/echarts-en.common.min.js
// ==/UserScript==

(function (w, d) {
    'use strict';

    w.onload = () => {
        const btnContainer = document.createElement('div');
        btnContainer.innerHTML = `
        <div style="position: fixed;top: 50%;height: 100px; left: 50%; width: 1000px; background: white; border: 1px solid black;">
            <span id="exp-csv-btn">导出CSV</span>
            <span id="pie-chart-btn">显示统计</span>
        </div>
        `;
        d.body.appendChild(btnContainer);

        const expCSVBtn = document.getElementById('exp-csv-btn');
        expCSVBtn.innerText = '导出CSV';
        expCSVBtn.addEventListener('click', exportCSV);

        const pieChartBtn = document.getElementById('pie-chart-btn');
        pieChartBtn.innerText = '显示统计';
        pieChartBtn.addEventListener('click', exportPipeChart);

    }

    function exportPipeChart() {
        const chartContainer = document.createElement('div');
        chartContainer.innerHTML = '<div id="t-main" style="position: fixed;width: 600px;height:400px;"></div>';
        d.body.appendChild(chartContainer);

        const chart = echarts.init(document.getElementById('t-main'));
        const { traffic, daily, entertainment, food, other, sum } = prepareChartData();
        const option = {
            backgroundColor: '#2c343c',

            title: {
                text: `当月消费统计${sum}`,
                left: 'center',
                top: 20,
                textStyle: {
                    color: '#ccc'
                }
            },

            tooltip: {
                trigger: 'item',
                formatter: "{a} <br/>{b} : {c} ({d}%)"
            },

            visualMap: {
                show: false,
                min: 0,
                max: 100000,
                inRange: {
                    colorLightness: [0, 1]
                }
            },
            series: [
                {
                    name: '消费',
                    type: 'pie',
                    radius: '55%',
                    center: ['50%', '50%'],
                    data: [
                        { value: traffic, name: '交通' },
                        { value: daily, name: '日常消费' },
                        { value: entertainment, name: '娱乐' },
                        { value: food, name: '食物' },
                        { value: other, name: '其他' }
                    ].sort(function (a, b) { return a.value - b.value; }),
                    roseType: 'radius',
                    label: {
                        normal: {
                            textStyle: {
                                color: 'rgba(255, 255, 255, 0.3)'
                            }
                        }
                    },
                    labelLine: {
                        normal: {
                            lineStyle: {
                                color: 'rgba(255, 255, 255, 0.3)'
                            },
                            smooth: 0.2,
                            length: 10,
                            length2: 20
                        }
                    },
                    itemStyle: {
                        normal: {
                            color: '#c23531',
                            shadowBlur: 200,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    },

                    animationType: 'scale',
                    animationEasing: 'elasticOut',
                    animationDelay: function (idx) {
                        return Math.random() * 200;
                    }
                }
            ]
        }
        chart.setOption(option);
    }

    function prepareChartData() {
        let data = getTable();
        data = classifyItems(data);
        data = data
            .filter(e => e.amount > 0)
            .map(e => {
                return {
                    ...e,
                    date: e['date'],
                    description: e['description'],
                    amount: parseFloat(e['amount']),
                }
            }).filter(e => {
                return e['amount'] > 0;
            });

        const sum = data.reduce((p, n) => {
            return p + n['amount'];
        }, 0);

        return {
            sum,
            traffic: getTypeSum('traffic', data),
            trafficItems: getTypeItems('traffic', data),
            daily: getTypeSum('daily', data),
            dailyItems: getTypeItems('daily', data),
            entertainment: getTypeSum('entertainment', data),
            entertainmentItems: getTypeItems('entertainment', data),
            food: getTypeSum('food', data),
            foodItems: getTypeItems('food', data),
            // otherItems: getTypeItems('other', data),
            // other: getTypeSum('other', data),
        }
    }

    function getTypeItems(type, data) {
        return data
            .filter(e => e.type === type);
    }

    function getTypeSum(type, data) {
        return data
            .filter(e => e.type === type)
            .reduce((p, n) => {
                return p + n.amount;
            }, 0);
    }


    function classifyItems(data) {
        return data.map(e => {
            return {
                ...e,
                'type': whichType(e.description),
            }
        })
    }

    function whichType(str) {
        const keys = [
            { type: 'traffic', key: '铁路' },
            { type: 'traffic', key: '地铁' },
            { type: 'traffic', key: '摩拜' },
            { type: 'traffic', key: '鹏城车队' },
            { type: 'traffic', key: '滴滴' },
            { type: 'daily', key: '寻路商贸' },
            { type: 'daily', key: '美宜佳' },
            { type: 'daily', key: '京东到家' },
            { type: 'daily', key: '每日优鲜' },
            { type: 'daily', key: '京东' },
            { type: 'daily', key: '云上艾珀' },
            { type: 'daily', key: '便利店' },
            { type: 'daily', key: '极客时间' },
            { type: 'daily', key: '喜得乐' },
            { type: 'entertainment', key: '网之易' },
            { type: 'food', key: '鑫湘聚' },
            { type: 'food', key: '美食' },
            { type: 'food', key: '津味源' },
            { type: 'food', key: '餐饮' },
            { type: 'food', key: '美团点评' },
            { type: 'food', key: '三快在线' },
            { type: 'food', key: '大酒店' },
            { type: 'food', key: '骏昊顺科技' },
        ];
        for (let i = 0; i < keys.length; i++) {
            if (str.includes(keys[i].key)) {
                return keys[i].type;
            }
        }
        return 'other';
    }

    function exportCSV() {
        const data = getTable();
        var csv = Papa.unparse(data);
        download('stat.csv', csv);
    }

    function getTable() {
        const select = document.querySelector('#select_cont');
        const selector = select.value === 1 ? '#contentUn' : '#content';
        return [...document.querySelectorAll(selector + ' tr')].map(e => {
            const children = [...e.children];
            return {
                date: children[1].textContent,
                amount: children[2].textContent.slice(1),
                description: children[3].textContent,
            }
        });
    }

    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }
})(window, document);