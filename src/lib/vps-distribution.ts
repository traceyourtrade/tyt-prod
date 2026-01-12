import { getWorkerModel } from "@/models/workers/worker.model";
import { getASAccountModel } from "@/models/accounts/asAccounts.model";

interface WorkerAccountCount {
    workerName: string;
    workerId: string;
    accountCount: number;
}

export async function getAvailableVPS(): Promise<string> {
    try {
        const WorkerModel = await getWorkerModel();
        const ASAccountModel = await getASAccountModel();

        const workers = await WorkerModel.find({}).lean();
        
        if (!workers || workers.length === 0) {
            console.warn("⚠️ No workers found in database, using default VPS");
            return "ASDF01";
        }

        const workerNames = workers.map(w => w.workerName);

        const accountCounts = await ASAccountModel.aggregate([
            {
                $match: {
                    vpsId: { $in: workerNames }
                }
            },
            {
                $group: {
                    _id: "$vpsId",
                    count: { $sum: 1 }
                }
            }
        ]);

        const countMap: Record<string, number> = {};
        accountCounts.forEach((item: { _id: string; count: number }) => {
            countMap[item._id] = item.count;
        });

        const workerAccountCounts: WorkerAccountCount[] = workers.map(worker => ({
            workerName: worker.workerName,
            workerId: worker.workerId,
            accountCount: countMap[worker.workerName] || 0
        }));

        workerAccountCounts.sort((a, b) => a.accountCount - b.accountCount);

        console.log("📊 VPS Distribution:", workerAccountCounts.map(w => `${w.workerName}: ${w.accountCount}`).join(", "));

        const selectedWorker = workerAccountCounts[0];
        console.log(`✅ Selected VPS: ${selectedWorker.workerName} (${selectedWorker.accountCount} accounts)`);
        
        return selectedWorker.workerName;

    } catch (error) {
        console.error("❌ Error in VPS distribution:", error);
        return "ASDF01";
    }
}

export async function getVPSDistributionStats(): Promise<WorkerAccountCount[]> {
    try {
        const WorkerModel = await getWorkerModel();
        const ASAccountModel = await getASAccountModel();

        const workers = await WorkerModel.find({}).lean();
        
        if (!workers || workers.length === 0) {
            return [];
        }

        const workerNames = workers.map(w => w.workerName);

        const accountCounts = await ASAccountModel.aggregate([
            {
                $match: {
                    vpsId: { $in: workerNames }
                }
            },
            {
                $group: {
                    _id: "$vpsId",
                    count: { $sum: 1 }
                }
            }
        ]);

        const countMap: Record<string, number> = {};
        accountCounts.forEach((item: { _id: string; count: number }) => {
            countMap[item._id] = item.count;
        });

        return workers.map(worker => ({
            workerName: worker.workerName,
            workerId: worker.workerId,
            accountCount: countMap[worker.workerName] || 0
        }));

    } catch (error) {
        console.error("❌ Error getting VPS stats:", error);
        return [];
    }
}
