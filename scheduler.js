const cron = require("node-cron");
const path = require("path");
const helper = require("./helper");
const ExcelApp = require("./ExcelApp");
const logger = require("./logger");

class JobQueue {
    constructor() {
        this.highPriorityQueue = []; // Untuk job Daily/Weekly
        this.normalQueue = [];       // Untuk job per menit (* /10, * /15, dll)
        this.isProcessing = false;
    }

    // Menambahkan job berdasarkan trigger/prioritas
    add(jobFunction, isHighPriority = false) {
        if (isHighPriority) {
            this.highPriorityQueue.push(jobFunction);
        } else {
            this.normalQueue.push(jobFunction);
        }
        
        if (!this.isProcessing) {
            this.process();
        }
    }

    async process() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        // Loop akan terus berjalan selama masih ada antrean di salah satu list
        while (this.highPriorityQueue.length > 0 || this.normalQueue.length > 0) {
            
            // PRIORITAS: Ambil dari highPriorityQueue dulu sampai habis
            const job = this.highPriorityQueue.length > 0 
                ? this.highPriorityQueue.shift() 
                : this.normalQueue.shift();

            try {
                await job(); // Jalankan secara berurutan
            } catch (error) {
                logger.error(`Queue Processing Error: ${error.message}`);
            }
        }

        this.isProcessing = false;
        try { helper.standBy(); } catch (e) {}
    }
}

const queue = new JobQueue();

async function run() {
    try {
        const taskScheduler = await ExcelApp.readExcelFile("taskScheduler.xlsx", "job");
        if (!Array.isArray(taskScheduler)) return;

        const scheduleGroups = {};

        taskScheduler.forEach(task => {
            if (task.enable !== '1') return;
            
            if (!scheduleGroups[task.cron]) {
                scheduleGroups[task.cron] = [];
            }
            scheduleGroups[task.cron].push(task);
            
            try { helper.sendLogs(`Registered: ${task.description}`, true); } catch (e) {}
        });

        Object.entries(scheduleGroups).forEach(([cronExpression, tasks]) => {
            cron.schedule(
                cronExpression,
                () => {
                    tasks.forEach((task) => {
                        // Tentukan prioritas berdasarkan kolom 'trigger' dari Excel
                        const isHigh = (task.trigger === 'daily' || task.trigger === 'weekly' || task.trigger === 'monthly' || task.trigger === 'yearly' || task.trigger === 'weekday');
                        queue.add(() => executeJob(task), isHigh);
                    });
                },
                { timezone: "Asia/Jakarta", runOnInit: false }
            );
        });
    } catch (error) {
        logger.error(`Run Scheduler Error: ${error.message}`);
    }
}

async function executeJob(task) {
    const start = Date.now();
    try { helper.sendInfo(`${task.description} Running...`); } catch (e) {}

    try {
        const modulePath = path.join(__dirname, task.file);
        delete require.cache[require.resolve(modulePath)]; // Refresh module cache
        
        const taskModule = require(modulePath);
        if (typeof taskModule[task.module] !== "function") {
            throw new Error(`Module ${task.module} not found`);
        }

        await taskModule[task.module](); // Eksekusi Job
        
    } catch (err) {
        logger.error(`(${task.description}) Error: ${err.message}`);
    } finally {
        const duration = ((Date.now() - start) / 1000).toFixed(2);
        try { helper.sendInfo(`${task.description} Finished (${duration}s)`); } catch (e) {}
    }
}

module.exports = { run };