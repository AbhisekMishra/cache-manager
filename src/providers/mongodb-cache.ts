import { DataSource, Repository } from 'typeorm';
import { MongoConfig, CacheProvider, CacheOptions } from '../types';
import { withTimeout } from '../utils/timeout';
import { Entity, ObjectIdColumn, Column, Index, ObjectId } from 'typeorm';
import { logCacheOperation, logInitialization } from '../utils/logger';

@Entity('cache')
class CacheDocument {
    @ObjectIdColumn()
    _id!: ObjectId;

    @Column()
    @Index({ unique: true })
    key!: string;

    @Column()
    value!: string;

    @Column({ nullable: true })
    expiresAt?: Date;
}

export class MongoDBCacheProvider implements CacheProvider {
    private dataSource: DataSource;
    private repository: Repository<CacheDocument>;

    constructor(config: MongoConfig) {
        this.dataSource = new DataSource({
            type: 'mongodb',
            url: config.url,
            database: config.database,
            entities: [CacheDocument],
            synchronize: true
        });
    }

    async initialize(): Promise<void> {
        const startTime = Date.now();
        try {
            await withTimeout(this.dataSource.initialize());
            this.repository = this.dataSource.getRepository(CacheDocument);
            logInitialization('MongoDB', true);
        } catch (error) {
            logInitialization('MongoDB', false, error as Error);
            throw error;
        }
    }

    async get<T>(key: string): Promise<T | null> {
        const startTime = Date.now();
        try {
            const doc = await withTimeout(this.repository.findOne({ where: { key } }));

            if (!doc) {
                logCacheOperation('get', key, true, Date.now() - startTime);
                return null;
            }

            if (doc.expiresAt && doc.expiresAt < new Date()) {
                // Instead of deleting, update the expiry time
                const newDoc = new CacheDocument();
                newDoc.key = doc.key;
                newDoc.value = doc.value;
                newDoc.expiresAt = new Date(Date.now() + ((doc.expiresAt.getTime() - (doc.expiresAt.getTime() - Date.now())) / 1000) * 1000);
                await withTimeout(this.repository.save(newDoc));
                try {
                    const value = JSON.parse(doc.value) as T;
                    logCacheOperation('get', key, true, Date.now() - startTime);
                    return value;
                } catch (error) {
                    logCacheOperation('get', key, false, Date.now() - startTime, error as Error);
                    return null;
                }
            }

            try {
                const value = JSON.parse(doc.value) as T;
                logCacheOperation('get', key, true, Date.now() - startTime);
                return value;
            } catch (error) {
                logCacheOperation('get', key, false, Date.now() - startTime, error as Error);
                return null;
            }
        } catch (error) {
            logCacheOperation('get', key, false, Date.now() - startTime, error as Error);
            throw error;
        }
}

    async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
        const startTime = Date.now();
        try {
            const existingDoc = await withTimeout(this.repository.findOne({ where: { key } }));
            const doc = existingDoc || new CacheDocument();
            doc.key = key;
            doc.value = JSON.stringify(value);
            doc.expiresAt = options?.ttl ? new Date(Date.now() + options.ttl * 1000) : undefined;
            
            await withTimeout(this.repository.save(doc));
            logCacheOperation('set', key, true, Date.now() - startTime);
        } catch (error) {
            logCacheOperation('set', key, false, Date.now() - startTime, error as Error);
            throw error;
        }
    }

    async delete(key: string): Promise<void> {
        const startTime = Date.now();
        try {
            await withTimeout(this.repository.delete({ key }));
            logCacheOperation('delete', key, true, Date.now() - startTime);
        } catch (error) {
            logCacheOperation('delete', key, false, Date.now() - startTime, error as Error);
            throw error;
        }
    }

    async clear(): Promise<void> {
        const startTime = Date.now();
        try {
            await withTimeout(this.repository.clear());
            logCacheOperation('clear', 'all', true, Date.now() - startTime);
        } catch (error) {
            logCacheOperation('clear', 'all', false, Date.now() - startTime, error as Error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        await withTimeout(this.dataSource.destroy());
    }
}