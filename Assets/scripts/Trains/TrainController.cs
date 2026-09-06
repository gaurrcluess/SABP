using UnityEngine;

public class TrainController : MonoBehaviour
{
    public string trainId = "T001";

    public Transform[] waypoints;

    public float speed = 10f;

    private int currentWaypoint = 0;

    void Update()
    {
        if (waypoints.Length == 0)
            return;

        // If all waypoints are completed, stop
        if (currentWaypoint >= waypoints.Length)
            return;

        Transform target = waypoints[currentWaypoint];

        transform.position = Vector3.MoveTowards(
            transform.position,
            target.position,
            speed * Time.deltaTime
        );

        Vector3 direction = target.position - transform.position;

        if (direction != Vector3.zero)
        {
            transform.rotation = Quaternion.LookRotation(direction);
        }

        if (Vector3.Distance(transform.position, target.position) < 0.5f)
        {
            currentWaypoint++;
        }
    }
}
