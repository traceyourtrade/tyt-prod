import { getWorkerModel } from "@/models/workers/worker.model";
import { getASAccountModel } from "@/models/accounts/asAccounts.model";

interface ClaimResult {
    workerName: string;
    workerId: string;
    release: () => Promise<void>;
}

let countersInitialized = false;

async function ensureCountersInitialized(): Promise<void> {
    if (countersInitialized) return;
    
    try {
        console.log("🔄 Initializing VPS worker counters from ASacc data...");
        await syncWorkerCounts();
        countersInitialized = true;
        console.log("✅ VPS worker counters initialized");
    } catch (error) {
        console.error("❌ Failed to initialize worker counters:", error);
    }
}

export async function claimWorkerVps(): Promise<ClaimResult> {
    await ensureCountersInitialized();
    
    const WorkerModel = await getWorkerModel();
    
    const claimedWorker = await WorkerModel.findOneAndUpdate(
        {},
        { $inc: { activeAccountCount: 1 } },
        { 
            sort: { activeAccountCount: 1, createdAt: 1 },
            new: true
        }
    );
    
    if (!claimedWorker) {
        console.warn("⚠️ No workers found in database, using default VPS");
        return {
            workerName: "ASDF01",
            workerId: "default",
            release: async () => {}
        };
    }
    
    console.log(`✅ Claimed VPS: ${claimedWorker.workerName} (now ${claimedWorker.activeAccountCount} accounts)`);
    
    let released = false;
    const release = async () => {
        if (released) {
            console.log(`ℹ️ VPS claim already released: ${claimedWorker.workerName}`);
            return;
        }
        released = true;
        
        try {
            const result = await WorkerModel.findOneAndUpdate(
                { workerId: claimedWorker.workerId, activeAccountCount: { $gt: 0 } },
                { $inc: { activeAccountCount: -1 } },
                { new: true }
            );
            
            if (result) {
                console.log(`🔄 Released VPS claim: ${claimedWorker.workerName} (now ${result.activeAccountCount} accounts)`);
            } else {
                console.warn(`⚠️ VPS release skipped (counter already at 0 or worker not found): ${claimedWorker.workerName}`);
                countersInitialized = false;
                console.log("🔄 Triggering counter reconciliation on next claim...");
            }
        } catch (error) {
            console.error(`❌ Failed to release VPS claim for ${claimedWorker.workerName}:`, error);
            countersInitialized = false;
        }
    };
    
    return {
        workerName: claimedWorker.workerName,
        workerId: claimedWorker.workerId,
        release
    };
}

export async function claimVpsWithRollback(): Promise<ClaimResult> {
    return await claimWorkerVps();
}

export async function syncWorkerCounts(): Promise<void> {
    try {
        const WorkerModel = await getWorkerModel();
        const ASAccountModel = await getASAccountModel();

        const workers = await WorkerModel.find({}).lean();
        
        if (!workers || workers.length === 0) {
            console.log("ℹ️ No workers to sync");
            return;
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

        for (const worker of workers) {
            const actualCount = countMap[worker.workerName] || 0;
            await WorkerModel.updateOne(
                { workerId: worker.workerId },
                { $set: { activeAccountCount: actualCount } }
            );
            console.log(`📊 Synced ${worker.workerName}: ${actualCount} accounts`);
        }

        console.log("✅ Worker counts synchronized successfully");

    } catch (error) {
        console.error("❌ Error syncing worker counts:", error);
        throw error;
    }
}

export async function getVPSDistributionStats() {
    try {
        const WorkerModel = await getWorkerModel();
        const workers = await WorkerModel.find({}).lean();
        
        return workers.map(worker => ({
            workerName: worker.workerName,
            workerId: worker.workerId,
            accountCount: worker.activeAccountCount || 0
        }));

    } catch (error) {
        console.error("❌ Error getting VPS stats:", error);
        return [];
    }
}
